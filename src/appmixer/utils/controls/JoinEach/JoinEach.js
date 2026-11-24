'use strict';

// Every join in progress (one per correlation ID) keeps the messages that arrived so far, the number
// of messages to wait for and its timeout. They are kept in FLOW state, one entry per join, under a
// key that includes this component's ID (two JoinEach components of a flow can join the same Each).
//
// Not component state: the engine keeps the whole component state of a component in ONE document,
// loads all of it for every message the component receives and returns all of it on every
// stateSet/stateUnset. With many joins in progress at once (each holding full messages), they all add
// up in that one document and every message costs the workers a full parse of it - the same problem
// as the sequential Each (appmixer-components#3159). JoinEach 1.1.2 kept a join in component state
// under the bare correlation ID; such a join is moved to flow state the first time it is touched.

function getCorrelationId(message) {

    return message.content.correlationId || message.correlationId;
}

const joinKey = (context, correlationId) => `joineach:${context.componentId}:${correlationId}`;

/**
 * context.flow.stateSet with the 16 MB document limit reported the way context.stateSet reports it -
 * as a CancelError (the value will never fit, retrying is pointless). The engine passes the raw Mongo
 * error through for flow state.
 * @param {Object} context - Appmixer context
 * @param {string} key
 * @param {*} value
 */
async function flowStateSet(context, key, value) {

    try {
        await context.flow.stateSet(key, value);
    } catch (err) {
        const tooBig = err?.code === 'ERR_OUT_OF_RANGE' || err?.code === 17420 || err?.code === 17419 ||
            err?.code === 10334 || /offset is out of bounds|larger than the maximum|too large/i.test(err?.message || '');
        if (tooBig) {
            throw new context.CancelError(`The data is too big to be kept (16 MB limit): ${err.message}`);
        }
        throw err;
    }
}

/**
 * The state of a join. Must be called with the join lock held.
 *
 * Whatever the previous version (1.1.2) keeps in component state under the correlation ID is merged in
 * and removed: a join it started is moved to flow state, and while workers still run the previous
 * version right after an upgrade, a message it handled for a join already in flow state lands in
 * component state - merging both keeps such a join complete instead of splitting it in two.
 * @param {Object} context - Appmixer context
 * @param {string} correlationId
 * @returns {Promise<Object>}
 */
async function loadJoin(context, correlationId) {

    const key = joinKey(context, correlationId);
    const join = await context.flow.stateGet(key);
    const legacy = await context.stateGet(correlationId);
    if (!legacy) {
        return join || {};
    }
    const merged = {
        ...(join || {}),
        inputMessages: [...(join?.inputMessages || []), ...(legacy.inputMessages || [])],
        legacy: true
    };
    const count = join?.count ?? legacy.count;
    if (count !== undefined) {
        merged.count = count;
    }
    // The timeout is set by whichever version handled the (single) `count` message.
    const timeoutId = join?.timeoutId || legacy.timeoutId;
    if (timeoutId) {
        merged.timeoutId = timeoutId;
    }
    // Flow state first, component state after: a crash in between loses nothing (the messages would be
    // merged once more - at-least-once, like a re-delivered message).
    await flowStateSet(context, key, merged);
    await context.stateUnset(correlationId);
    return merged;
}

/**
 * @param {Object} context - Appmixer context
 * @param {string} correlationId
 * @param {Object} join
 */
async function saveJoin(context, correlationId, join) {

    await flowStateSet(context, joinKey(context, correlationId), join);
}

/**
 * Forget a finished join.
 * @param {Object} context - Appmixer context
 * @param {string} correlationId
 * @param {Object} join
 */
async function removeJoin(context, correlationId, join) {

    if (join.legacy) {
        // Moved from component state by loadJoin - make sure nothing is left there.
        await context.stateUnset(correlationId);
    }
    await context.flow.stateUnset(joinKey(context, correlationId));
}

module.exports = {

    async receive(context) {

        if (context.messages.count) {

            if (context.messages.count.content.count === 0) {
                // if the array is empty, then there will be no message on the 'in' port, we can directly
                // send a message to the 'out' port.
                return context.sendJson({ items: [] }, 'out');
            }

            const correlationId = getCorrelationId(context.messages.count);
            // we need to know the number of messages to wait for (with the same correlationId)
            let lock = null;
            try {
                lock = await context.lock(correlationId);
                const count = context.messages.count.content.count;

                // if the awaited number of items is 0, we won't be storing anything into state
                if (count === 0) {
                    return;
                }

                const correlationIdState = await loadJoin(context, correlationId);
                correlationIdState.count = count;

                // all messages for this correlationId already arrived (before a message to the done
                // port arrived)
                if (correlationIdState.inputMessages
                    && correlationIdState.inputMessages.length >= count) {
                    await removeJoin(context, correlationId, correlationIdState);
                    if (correlationIdState.timeoutId) {
                        await context.clearTimeout(correlationIdState.timeoutId);
                    }
                    return context.sendJson({ items: correlationIdState.inputMessages }, 'out');
                }

                if (context.messages.count.content.timeout) {
                    correlationIdState.timeoutId = await context.setTimeout(
                        { correlationId },
                        context.messages.count.content.timeoutValue * 1000);
                }

                await saveJoin(context, correlationId, correlationIdState);
            } finally {
                lock?.unlock();
            }
        }

        if (context.messages.timeout) {

            let lock = null;
            try {
                const correlationId = getCorrelationId(context.messages.timeout);
                lock = await context.lock(correlationId);

                const correlationIdState = await loadJoin(context, correlationId);

                if (!correlationIdState.timeoutId) {
                    // before getting the lock, an input message may have arrived and timeout
                    // may have been cleared, in that case, do nothing
                    return;
                }

                await removeJoin(context, correlationId, correlationIdState);
                return context.sendJson({
                    items: correlationIdState.inputMessages || [],
                    count: correlationIdState.count,
                    arrived: (correlationIdState.inputMessages || []).length
                }, 'timeout');
            } finally {
                lock?.unlock();
            }
        }

        if (context.messages.in) {

            let lock = null;
            try {
                const correlationId = getCorrelationId(context.messages.in);
                lock = await context.lock(correlationId);
                const correlationIdState = await loadJoin(context, correlationId);
                correlationIdState.inputMessages = correlationIdState.inputMessages || [];
                correlationIdState.inputMessages.push(context.messages.in.originalContent);

                // message to the 'done' port with the number of items to wait for has not arrived yet
                if (!correlationIdState.hasOwnProperty('count')
                    // or the number of input messages is lower than the expected number
                    || !(correlationIdState.inputMessages.length >= correlationIdState.count)) {
                    await saveJoin(context, correlationId, correlationIdState);
                    return;
                }

                if (correlationIdState.inputMessages.length >= correlationIdState.count) {
                    // all messages for that particular correlationId have arrived
                    await removeJoin(context, correlationId, correlationIdState);
                    if (correlationIdState.timeoutId) {
                        await context.clearTimeout(correlationIdState.timeoutId);
                    }
                    return context.sendJson({ items: correlationIdState.inputMessages }, 'out');
                }
            } finally {
                lock?.unlock();
            }
        }
    }
};
