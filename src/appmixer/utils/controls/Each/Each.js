'use strict';
const uuid = require('uuid');

// Timeout interval in milliseconds (3 minutes)
const TIMEOUT_INTERVAL = (context) => parseInt(context.config.timeoutIntervalMs, 10) || 180000; // 3 minutes
// Safety margin to account for sendJson latency (use 85% of timeout, reserve 15%)
const TIMEOUT_SAFETY_MARGIN = 0.85;

function parseVariable(listVariable) {

    const re = new RegExp(/{{{(.*?)}}}/g);
    return re.exec(listVariable)[1];
}

/**
 * Returns input transformation config (lambda)
 * @param {Object} componentConfig
 * @return {Object|null}
 */
function getInputConfig(componentConfig) {

    try {
        for (let senderId in componentConfig) {
            const senderConfig = componentConfig[senderId];
            for (let senderPort in senderConfig) {
                if (senderConfig.hasOwnProperty(senderPort)) {
                    return {
                        listVariable: `{{{${Object.values(senderConfig[senderPort]?.modifiers?.list)[0].variable}}}}`,
                        senderId: senderId,
                        senderPort: senderPort,
                        modifiers: Object.values(senderConfig[senderPort]?.modifiers?.list)[0].functions || []
                    };
                }
            }
        }
    } catch (err) {
        // The Each input has to be a `list`. And it has to be a list defined by a variable. In all other cases
        // return null
        return null;
    }

    return null;
}

/**
 * Calculate upper bound on batch size based on delay and timeout interval.
 * Actual items sent may be fewer due to wall-clock safety margin in sendBatch.
 * @param {number} delay - Delay between items in milliseconds
 * @returns {number} - Upper bound on items per batch (used for pre-slicing, not guaranteed count)
 */
function calculateBatchSize(context, delay) {
    return Math.floor(TIMEOUT_INTERVAL(context) / delay);
}

/**
 * Send a batch of items with delay between each item.
 * Stops early if timeout safety deadline is exceeded.
 * @param {Object} context - Appmixer context
 * @param {Array} items - Items to send
 * @param {number} startIndex - Starting index in the original list
 * @param {number} count - Total count of items
 * @param {string} correlationId - Correlation ID for this Each execution
 * @param {number} delay - Delay between items in milliseconds
 * @returns {number} - Number of items actually sent (may be less than items.length if deadline exceeded)
 */
async function sendBatch(context, items, startIndex, count, correlationId, delay) {

    const startTime = Date.now();
    const deadline = TIMEOUT_INTERVAL(context) * TIMEOUT_SAFETY_MARGIN;
    let i = 0;

    for (; i < items.length; i++) {
        // Check if we're approaching the timeout deadline
        if (Date.now() - startTime >= deadline) {
            break;
        }

        const listItem = {
            index: startIndex + i,
            value: items[i],
            count,
            correlationId
        };
        await context.sendJson(listItem, 'item');

        // Add delay between items (except for the last item)
        if (delay && i < items.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return i;
}

const generateOutputPortOptions = async function(context) {

    const componentConfig = context.flowDescriptor[context.componentId].config?.transform['in'] || {};
    const inputConfig = getInputConfig(componentConfig);

    if (inputConfig) {
        if (!inputConfig.modifiers.length) {
            const [, componentId, port, ...rootVariableParts] = parseVariable(inputConfig.listVariable)
                .split('.');
            const allProperties = await context.loadOutputSchemaProperties(componentId);
            const portProperties = allProperties[port];

            const basePath = `${port}.${rootVariableParts.join('.')}`;
            const variableProperties = portProperties.filter(prop => {
                return prop.path.startsWith(basePath) && prop.path !== basePath;
            });

            // Exclude properties that have a subproperty parent that is an array, since those wouldn't be accesible
            const arrayFilteredProperties = variableProperties.filter(prop => {
                const hasArrayParent = variableProperties.some(varProp => {
                    const isParent = prop.path.startsWith(varProp.path) && prop.path !== varProp.path;
                    if (!isParent) {
                        return false;
                    }

                    return varProp.type === 'array';
                });
                return !hasArrayParent;
            });

            const mappedProperties = arrayFilteredProperties.map(prop => {
                const fallbackLabel = prop.path.replace(basePath, 'item');
                const value = prop.path.replace(basePath, 'value');
                return { label: prop.label || fallbackLabel, value };
            });

            return context.sendJson([
                ...mappedProperties,
                { label: 'Index', value: 'index' },
                { label: 'Value', value: 'value' },
                { label: 'Items Count', value: 'count' },
                { label: 'Correlation ID', value: 'correlationId' }
            ], 'item');
        }
    }

    return context.sendJson([
        { label: 'Index', value: 'index' },
        { label: 'Value', value: 'value' },
        { label: 'Items Count', value: 'count' },
        { label: 'Correlation ID', value: 'correlationId' }
    ], 'item');
};

const getItemsList = function(context, list) {
    if (typeof list === 'string') {
        // Try to parse string as JSON.
        try {
            list = JSON.parse(list);
        } catch (error) {
            throw new context.CancelError(
                'Property \'list\' should be array or well formed JSON array string. ' +
                'In case of CSV string, use modifier \'Split\' to create an Array.',
                error
            );
        }
    }

    return list;
};


module.exports = {

    async receive(context) {

        const { buildOutPortOptions = false } = context.properties;

        if (context.messages.timeout) {
            const { id } = context.messages.timeout.content;

            // Fetch the stored data from the plugin (items list only)
            const storedData = await context.callAppmixer({
                endPoint: `/plugins/appmixer/utils/controls/${encodeURIComponent(id)}`,
                method: 'GET'
            });

            if (!storedData || !storedData.items) {
                // Data no longer exists, nothing to process
                await context.log({ 'step': 'no-data', message: 'Each timeout: nothing to process, stored data missing or has no items' });
                return;
            }

            const { items, delay, correlationId, count } = storedData;

            // Get current index from state (same pattern as non-delayed Each)
            const lastSentIndexCache = await context.stateGet(id);
            const currentIndex = lastSentIndexCache?.index || 0;

            const batchSize = calculateBatchSize(context, delay);

            if (currentIndex >= items.length) {
                // All items have been processed, clean up and send done
                await context.callAppmixer({
                    endPoint: `/plugins/appmixer/utils/controls/${encodeURIComponent(id)}`,
                    method: 'DELETE'
                });
                await context.stateUnset(id);
                await context.sendJson({ count, correlationId }, 'done');
                return;
            }

            // Get the batch to process (single slice, bounded by the batch-size upper bound)
            const batchItems = items.slice(currentIndex, currentIndex + batchSize);

            // Send the batch with delays, returns actual count sent (may be less if deadline exceeded)
            const actualSent = await sendBatch(context, batchItems, currentIndex, count, correlationId, delay);
            const newIndex = currentIndex + actualSent;

            // Persist progress once the batch finishes. This is at-least-once: a crash after some
            // items were sent but before this stateSet will re-deliver the timeout and re-send the batch.
            await context.stateSet(id, { index: newIndex });

            if (newIndex >= items.length) {
                // All items have been sent, clean up and send done
                await context.callAppmixer({
                    endPoint: `/plugins/appmixer/utils/controls/${encodeURIComponent(id)}`,
                    method: 'DELETE'
                });
                await context.stateUnset(id);
                await context.sendJson({ count, correlationId }, 'done');
            } else {
                // Schedule next timeout
                await context.setTimeout({ id, timestamp: new Date() }, TIMEOUT_INTERVAL(context));
            }

            return;
        }

        if (buildOutPortOptions) {
            return await generateOutputPortOptions(context);
        }

        let list = getItemsList(context, context.messages.in.content.list);

        const eachCorrelationId = uuid.v4();
        const { delay } = context.messages.in.content;

        // Guard against invalid delay. A negative delay would produce a negative batch size,
        // yielding an empty batch that never makes progress and re-schedules timeouts forever.
        if (delay != null && delay < 0) {
            throw new context.CancelError('Property \'delay\' must be a non-negative number (milliseconds).');
        }

        if (!Array.isArray(list)) {
            // Not an array, send empty done
            await context.sendJson({ count: 0, correlationId: eachCorrelationId }, 'done');
            return;
        }

        const count = list.length;

        if (delay) {
            const id = context.id;
            const batchSize = calculateBatchSize(context, delay);

            // Calculate how many items we can send in the first batch
            const firstBatchItems = list.slice(0, batchSize);

            // Send the first batch immediately with delays, returns actual count sent
            const actualSent = await sendBatch(context, firstBatchItems, 0, count, eachCorrelationId, delay);
            const currentIndex = actualSent;

            if (currentIndex >= list.length) {
                // All items sent in first batch, we're done
                await context.sendJson({ count, correlationId: eachCorrelationId }, 'done');
            } else {
                // Store the list in MongoDB via plugin for later processing
                await context.callAppmixer({
                    endPoint: `/plugins/appmixer/utils/controls/${encodeURIComponent(id)}`,
                    method: 'POST',
                    body: {
                        items: list,
                        delay,
                        correlationId: eachCorrelationId,
                        count
                    }
                });

                // Store current index in state (same pattern as non-delayed Each)
                await context.stateSet(id, { index: currentIndex });

                // Schedule timeout to process the next batch
                await context.setTimeout({ id, timestamp: new Date() }, TIMEOUT_INTERVAL(context));
            }
            return;
        }

        // No delay - process all items immediately
        const contextId = context.id;
        const lastSentIndexCache = await context.stateGet(contextId);
        const resumeOffset = lastSentIndexCache?.index || 0;
        if (lastSentIndexCache) {
            list = list.slice(resumeOffset);
        }
        for (let i = 0; i < list.length; i++) {
            const absoluteIndex = i + resumeOffset;
            const listItem = {
                index: absoluteIndex,
                value: list[i],
                count,
                correlationId: eachCorrelationId
            };
            await context.sendJson(listItem, 'item');
            // Persist the ABSOLUTE index so a crash + resume continues from the right place
            // (storing the local loop index here would re-send already-processed items).
            await context.stateSet(contextId, {
                index: absoluteIndex
            });
        }

        await context.sendJson({ count, correlationId: eachCorrelationId }, 'done');
        // at this point we will remove the store index. Otherwise, the state would keep growing until it would
        // reach the limit of the document
        return context.stateUnset(contextId);
        // if now the engine crashes, the array and all its items would be sent to the output port again
    }
};
