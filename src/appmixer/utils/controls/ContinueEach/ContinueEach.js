'use strict';

// Where a sequential Each publishes the webhook target of its loop - keep in sync with
// Each/EachSequential.js.
const targetKey = id => `each:${id}`;

// The acknowledgement goes through the public API. On hosted tenants the ingress caps the requests a
// user has in flight at once (Traefik InFlightReq: HTTP 429 'max connections reached: <n>'), so many
// sequential loops acknowledging at the same moment get rejected. The engine answers 503
// INPUT_QUEUE_CAPACITY_EXCEEDED when the input queue is full. Both are momentary: retry a few times
// with a jittered backoff (about 20 s at most, well below the minimal Item Timeout of 60 s) instead
// of failing the message and leaving the item to the slower engine retry or to the item timeout.
const ACK_ATTEMPTS = 7;
const ACK_BACKOFF_MS = 250;
const ACK_BACKOFF_MAX_MS = 5000;

/**
 * @param {*} err - Whatever context.callAppmixer rejected with
 * @returns {boolean}
 */
function isMomentaryRejection(err) {

    const status = err?.statusCode ?? err?.status ?? err?.response?.status;
    if (status === 429 || status === 503) {
        return true;
    }
    if (err?.code === 'INPUT_QUEUE_CAPACITY_EXCEEDED') {
        return true;
    }
    const message = typeof err === 'string' ? err : `${err?.message || ''} ${err?.error || ''}`;
    return /max connections reached|too many requests|at capacity/i.test(message);
}

/**
 * context.callAppmixer, retried on a momentary rejection (see above).
 * @param {Object} context - Appmixer context
 * @param {Object} options - context.callAppmixer options
 */
async function callWithRetry(context, options) {

    for (let attempt = 1; ; attempt++) {
        try {
            return await context.callAppmixer(options);
        } catch (err) {
            if (attempt >= ACK_ATTEMPTS || !isMomentaryRejection(err)) {
                throw err;
            }
            const backoff = Math.min(ACK_BACKOFF_MAX_MS, ACK_BACKOFF_MS * 2 ** (attempt - 1));
            // Full jitter: loops rejected together must not come back together.
            await new Promise(resolve => setTimeout(resolve, Math.round(backoff * (0.5 + Math.random() / 2))));
        }
    }
}

/**
 * The entry this item adds to the 'Result' list that Each emits on its 'done' port once the loop is
 * over: one object per item, with a field for every row of the 'Add to Result' expression. A value
 * that did not resolve (the variable is missing in this item's message) becomes null rather than
 * disappearing, so every entry has the same fields.
 * @param {Object} context - Appmixer context
 * @param {*} result - The raw `result` input ({ ADD: [{ name, value }] })
 * @returns {Object}
 */
function collectEntry(context, result) {

    const rows = Array.isArray(result?.ADD) ? result.ADD : [];
    const entry = {};
    rows.forEach((row, i) => {
        const name = typeof row?.name === 'string' ? row.name.trim() : '';
        if (!name) {
            // A row left completely empty is just an unused row.
            if (row?.value === undefined || row?.value === '') {
                return;
            }
            throw new context.CancelError(`Name is required in row ${i + 1} of 'Add to Result'!`);
        }
        entry[name] = row.value === undefined ? null : row.value;
    });
    return entry;
}

module.exports = {

    async receive(context) {

        const { correlationId, index: rawIndex, result } = context.messages.in.content;

        if (!correlationId) {
            throw new context.CancelError('Correlation ID is required!');
        }

        const index = (rawIndex == null || rawIndex === '') ? NaN : Number(rawIndex);
        if (!Number.isInteger(index) || index < 0) {
            throw new context.CancelError('Index is required and must be a non-negative integer!');
        }

        const entry = collectEntry(context, result);

        // The Each that emitted this item published where to acknowledge it (its component id and the
        // correlation of the message that started the loop) in the flow state under the loop id.
        const target = await context.flow.stateGet(targetKey(correlationId));

        if (!target) {
            // No sequential loop is waiting under this Correlation ID: the Each is not in sequential
            // mode, or the loop already finished. Not an error - the flow continues either way.
            await context.log({
                step: 'no-loop',
                message: 'Continue Each: no sequential Each loop is waiting for this Correlation ID.'
            });
            return context.sendJson({ correlationId, index }, 'out');
        }

        // Wake the Each up through its webhook URL. The correlation query makes the engine restore
        // the scope of the message that started the loop; enqueueOnly returns as soon as the message
        // is queued instead of waiting for a response. A late acknowledgement (the item already
        // timed out) or a duplicate is ignored by Each itself, so a retried call is harmless.
        const query = new URLSearchParams({ ...(target.webhookQuery || {}), enqueueOnly: 'true' });
        await callWithRetry(context, {
            endPoint: `/flows/${context.flowId}/components/${target.componentId}?${query}`,
            method: 'POST',
            body: { id: correlationId, index, result: entry }
        });

        return context.sendJson({ correlationId, index }, 'out');
    }
};
