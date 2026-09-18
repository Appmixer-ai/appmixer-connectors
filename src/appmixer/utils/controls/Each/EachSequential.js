'use strict';

// Everything related to the Each "sequential" mode lives here. A plain Each emits all items in one
// tight loop, so when the loop body has a variable latency the items overtake each other and leave
// the body in a different order. Each cannot see when the body is done with an item - sendJson only
// enqueues - so a delay between items merely spaces them out, it does not order them.
//
// In sequential mode Each emits ONE item and waits. The ContinueEach component, placed at the end of
// the loop body, acknowledges the item through the plugin (see routes.js, POST /{id}/next), which
// wakes this component up on its webhook port to emit the next item. The engine restores the scope
// of the message that started the loop for that webhook delivery, so every item continues the
// original branch and upstream variables stay resolvable in the loop body.
//
// The list is parked in the plugin store (the webhook delivery does not carry the `in` message); the
// index of the item in flight lives in component state. An item that is never acknowledged (the body
// failed, or a Condition filtered the item out before ContinueEach) is given up on after the item
// timeout, so the loop cannot hang forever.

const DEFAULT_ITEM_TIMEOUT = 300;
// The engine silently rounds any context.setTimeout below one minute up to one minute, so a smaller
// item timeout would not do what it says.
const MIN_ITEM_TIMEOUT = 60;

const storeEndpoint = id => `/plugins/appmixer/utils/controls/${encodeURIComponent(id)}`;
const lockName = id => `each-sequential:${id}`;

/**
 * Normalize and validate the item timeout (seconds).
 * @param {Object} context - Appmixer context
 * @param {*} rawItemTimeout
 * @returns {number}
 */
function parseItemTimeout(context, rawItemTimeout) {

    const itemTimeout = (rawItemTimeout == null || rawItemTimeout === '')
        ? DEFAULT_ITEM_TIMEOUT
        : Number(rawItemTimeout);
    if (!Number.isFinite(itemTimeout) || itemTimeout < MIN_ITEM_TIMEOUT) {
        throw new context.CancelError(
            `Property 'itemTimeout' must be a number of seconds, at least ${MIN_ITEM_TIMEOUT}.`
        );
    }
    return itemTimeout;
}

/**
 * The correlation query parameters of the message that started the loop. The engine needs all three
 * (correlationId, correlationInPort, messageId) to restore that message's scope on a webhook delivery.
 * @param {Object} context - Appmixer context
 * @returns {Object}
 */
function getWebhookQuery(context) {

    const url = new URL(context.getWebhookUrl({ inPortName: 'in' }));
    const query = {};
    ['correlationId', 'correlationInPort', 'messageId'].forEach(name => {
        if (url.searchParams.has(name)) {
            query[name] = url.searchParams.get(name);
        }
    });
    return query;
}

/**
 * Emit one item and record it as the item in flight. Must be called with the loop lock held: a fast
 * loop body can acknowledge the item before the state is written.
 */
async function sendItem(context, { id, index, value, count, correlationId, itemTimeout }) {

    const timeoutId = await context.setTimeout({ id, sequential: true, index }, itemTimeout * 1000);
    await context.sendJson({ index, value, count, correlationId }, 'item');
    // At-least-once: a crash between sendJson and stateSet re-sends this item on re-delivery rather
    // than losing it.
    await context.stateSet(id, { index, timeoutId });
}

/**
 * Handle the `in` message: park the list and emit the first item only.
 * @param {Object} context - Appmixer context
 * @param {Object} params
 * @param {Array} params.list - The full list to iterate
 * @param {string} params.correlationId - Correlation ID for this Each execution (the retry-stable context.id)
 * @param {number} params.count - Total count of items
 * @param {number} params.delay - Extra delay before each next item in milliseconds (0 = none)
 * @param {*} params.itemTimeout - Raw item timeout in seconds
 */
async function handleStart(context, { list, correlationId, count, delay, itemTimeout: rawItemTimeout }) {

    const id = context.id;
    const itemTimeout = parseItemTimeout(context, rawItemTimeout);

    if (count === 0) {
        return context.sendJson({ count, correlationId }, 'done');
    }

    let lock = null;
    try {
        lock = await context.lock(lockName(id));

        if (await context.stateGet(id)) {
            // The engine re-delivered `in` for a loop that is already running. The acknowledgement /
            // timeout chain drives it from here; starting over would re-send every item.
            return;
        }

        await context.callAppmixer({
            endPoint: storeEndpoint(id),
            method: 'POST',
            body: {
                items: list,
                delay,
                correlationId,
                count,
                sequential: true,
                itemTimeout,
                flowId: context.flowId,
                componentId: context.componentId,
                webhookQuery: getWebhookQuery(context)
            }
        });

        await sendItem(context, { id, index: 0, value: list[0], count, correlationId, itemTimeout });
    } finally {
        lock?.unlock();
    }
}

/**
 * Item `doneIndex` is finished (acknowledged or timed out): emit the next one, or `done` after the last.
 * Anything that does not refer to the item in flight is ignored. That covers a duplicated
 * acknowledgement (a loop body that fans out into two ContinueEach, an engine re-delivery), a late
 * acknowledgement of an item that already timed out, and a stale timeout.
 */
async function advance(context, id, doneIndex) {

    const isInFlight = state => state && state.index === doneIndex;

    // Cheap check before any work; repeated under the lock below.
    if (!isInFlight(await context.stateGet(id))) {
        return;
    }

    const nextIndex = doneIndex + 1;
    const record = await context.callAppmixer({
        endPoint: `${storeEndpoint(id)}?index=${nextIndex}`,
        method: 'GET'
    });

    if (!record) {
        await context.log({ step: 'no-data', message: 'Each sequential: stored list is missing, nothing to continue.' });
        return context.stateUnset(id);
    }

    const { item, count, correlationId, delay, itemTimeout } = record;

    if (delay && nextIndex < count) {
        // Outside of the lock: the delay can be longer than the lock TTL.
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    let lock = null;
    try {
        lock = await context.lock(lockName(id));

        const state = await context.stateGet(id);
        if (!isInFlight(state)) {
            return;
        }

        if (state.timeoutId) {
            await context.clearTimeout(state.timeoutId);
        }

        if (nextIndex >= count) {
            // `done` first, clean up after: a crash in between repeats `done` instead of losing it.
            await context.sendJson({ count, correlationId }, 'done');
            await context.callAppmixer({ endPoint: storeEndpoint(id), method: 'DELETE' });
            return context.stateUnset(id);
        }

        await sendItem(context, { id, index: nextIndex, value: item, count, correlationId, itemTimeout });
    } finally {
        lock?.unlock();
    }
}

/**
 * Handle the webhook delivery triggered by ContinueEach (through the plugin).
 * @param {Object} context - Appmixer context
 */
async function handleAck(context) {

    const { id, index } = (context.messages.webhook.content || {}).data || {};
    const doneIndex = Number(index);

    // Anything can POST to a webhook URL - ignore whatever is not a well-formed acknowledgement.
    if (!id || !Number.isInteger(doneIndex) || doneIndex < 0) {
        return context.log({ step: 'invalid-ack', message: 'Each sequential: ignoring a malformed acknowledgement.' });
    }

    return advance(context, id, doneIndex);
}

/**
 * Handle the item timeout: the item in flight was not acknowledged in time, move on.
 * @param {Object} context - Appmixer context
 */
async function handleTimeout(context) {

    const { id, index } = context.messages.timeout.content;

    await context.log({
        step: 'item-timeout',
        message: `Each sequential: item ${index} was not acknowledged by ContinueEach in time, continuing with the next item.`
    });

    return advance(context, id, index);
}

module.exports = {
    DEFAULT_ITEM_TIMEOUT,
    MIN_ITEM_TIMEOUT,
    handleStart,
    handleAck,
    handleTimeout
};
