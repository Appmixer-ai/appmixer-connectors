'use strict';

// Where a sequential Each publishes the webhook target of its loop - keep in sync with
// Each/EachSequential.js.
const targetKey = id => `each:${id}`;

/**
 * The values to collect for this item: every row of the 'Add to Result' expression becomes one entry
 * of the 'Result' list that Each emits on its 'done' port once the loop is over.
 * @param {*} result - The raw `result` input ({ ADD: [{ value }] })
 * @returns {Array}
 */
function collectValues(result) {

    const rows = Array.isArray(result?.ADD) ? result.ADD : [];
    return rows.map(row => row?.value).filter(value => value !== undefined);
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

        const values = collectValues(result);

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
        // timed out) or a duplicate is ignored by Each itself.
        const query = new URLSearchParams({ ...(target.webhookQuery || {}), enqueueOnly: 'true' });
        await context.callAppmixer({
            endPoint: `/flows/${context.flowId}/components/${target.componentId}?${query}`,
            method: 'POST',
            body: { id: correlationId, index, result: values }
        });

        return context.sendJson({ correlationId, index }, 'out');
    }
};
