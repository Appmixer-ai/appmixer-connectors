'use strict';
const uuid = require('uuid');

// Timeout interval in milliseconds (3 minutes)
const TIMEOUT_INTERVAL = 3 * 60 * 1000;

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
 * Calculate batch size based on delay and timeout interval.
 * @param {number} delay - Delay between items in milliseconds
 * @returns {number} - Number of items that can be processed in one timeout interval
 */
function calculateBatchSize(delay) {
    return Math.floor(TIMEOUT_INTERVAL / delay);
}

/**
 * Send a batch of items with delay between each item.
 * @param {Object} context - Appmixer context
 * @param {Array} items - Items to send
 * @param {number} startIndex - Starting index in the original list
 * @param {number} count - Total count of items
 * @param {string} correlationId - Correlation ID for this Each execution
 * @param {number} delay - Delay between items in milliseconds
 */
async function sendBatch(context, items, startIndex, count, correlationId, delay) {
    for (let i = 0; i < items.length; i++) {
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
}

module.exports = {

    async receive(context) {

        const { buildOutPortOptions = false } = context.properties;

        if (context.messages.timeout) {
            const { id } = context.messages.timeout.content;

            // Fetch the stored data from the plugin
            const { data: storedData } = await context.callAppmixer({
                endPoint: `/plugins/appmixer/utils/controls/${id}`,
                method: 'GET'
            });

            if (!storedData || !storedData.items) {
                // Data no longer exists, nothing to process
                return;
            }

            const { items, delay, correlationId, count, currentIndex } = storedData;
            const batchSize = calculateBatchSize(delay);
            const remainingItems = items.slice(currentIndex);

            if (remainingItems.length === 0) {
                // All items have been processed, clean up and send done
                await context.callAppmixer({
                    endPoint: `/plugins/appmixer/utils/controls/${id}`,
                    method: 'DELETE'
                });
                await context.sendJson({ count, correlationId }, 'done');
                return;
            }

            // Get the batch to process
            const batchItems = remainingItems.slice(0, batchSize);
            const newIndex = currentIndex + batchItems.length;

            // Send the batch with delays
            await sendBatch(context, batchItems, currentIndex, count, correlationId, delay);

            if (newIndex >= items.length) {
                // All items have been sent, clean up and send done
                await context.callAppmixer({
                    endPoint: `/plugins/appmixer/utils/controls/${id}`,
                    method: 'DELETE'
                });
                await context.sendJson({ count, correlationId }, 'done');
            } else {
                // Update the current index in the stored data
                await context.callAppmixer({
                    endPoint: `/plugins/appmixer/utils/controls/${id}`,
                    method: 'PUT',
                    body: {
                        ...storedData,
                        currentIndex: newIndex
                    }
                });

                // Schedule next timeout
                await context.setTimeout({ id }, TIMEOUT_INTERVAL);
            }

            return;
        }

        if (buildOutPortOptions) {

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

        } else {
            let { list } = context.messages.in.content;
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

            const eachCorrelationId = uuid.v4();
            const { delay } = context.messages.in.content;

            if (!Array.isArray(list)) {
                // Not an array, send empty done
                await context.sendJson({ count: 0, correlationId: eachCorrelationId }, 'done');
                return;
            }

            const count = list.length;

            if (delay) {
                const contextId = context.id;
                const batchSize = calculateBatchSize(delay);

                // Calculate how many items we can send in the first batch
                const firstBatchItems = list.slice(0, batchSize);
                const currentIndex = firstBatchItems.length;

                // Send the first batch immediately with delays
                await sendBatch(context, firstBatchItems, 0, count, eachCorrelationId, delay);

                if (currentIndex >= list.length) {
                    // All items sent in first batch, we're done
                    await context.sendJson({ count, correlationId: eachCorrelationId }, 'done');
                } else {
                    // Store the remaining list in MongoDB via plugin for later processing
                    await context.callAppmixer({
                        endPoint: `/plugins/appmixer/utils/controls/${contextId}`,
                        method: 'POST',
                        body: {
                            items: list,
                            delay,
                            correlationId: eachCorrelationId,
                            count,
                            currentIndex
                        }
                    });

                    // Schedule timeout to process the next batch
                    await context.setTimeout({ id: contextId }, TIMEOUT_INTERVAL);
                }

                return;
            }

            // No delay - process all items immediately
            const contextId = context.id;
            const lastSentIndexCache = await context.stateGet(contextId);
            if (lastSentIndexCache) {
                list = list.slice(lastSentIndexCache.index);
            }
            for (let i = 0; i < list.length; i++) {
                const listItem = {
                    index: i + (lastSentIndexCache?.index || 0),
                    value: list[i],
                    count,
                    correlationId: eachCorrelationId
                };
                await context.sendJson(listItem, 'item');
                await context.stateSet(contextId, {
                    index: i
                });
            }

            await context.sendJson({ count, correlationId: eachCorrelationId }, 'done');
            // at this point we will remove the store index. Otherwise, the state would keep growing until it would
            // reach the limit of the document
            return context.stateUnset(context.id);
            // if now the engine crashes, the array and all its items would be sent to the output port again
        }
    }
};
