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
 * The state of a join. Must be called with the join lock held. A join started by JoinEach 1.1.2 (in
 * component state under the correlation ID) is moved to flow state first.
 * @param {Object} context - Appmixer context
 * @param {string} correlationId
 * @returns {Promise<Object>}
 */
async function loadJoin(context, correlationId) {

    const key = joinKey(context, correlationId);
    const join = await context.flow.stateGet(key);
    if (join) {
        return join;
    }
    const legacy = await context.stateGet(correlationId);
    if (!legacy) {
        return {};
    }
    // Flow state first, component state after: a crash in between leaves the join readable (and the
    // legacy key is unset again when the join ends).
    await context.flow.stateSet(key, { ...legacy, legacy: true });
    await context.stateUnset(correlationId);
    return { ...legacy, legacy: true };
}

/**
 * @param {Object} context - Appmixer context
 * @param {string} correlationId
 * @param {Object} join
 */
async function saveJoin(context, correlationId, join) {

    await context.flow.stateSet(joinKey(context, correlationId), join);
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
