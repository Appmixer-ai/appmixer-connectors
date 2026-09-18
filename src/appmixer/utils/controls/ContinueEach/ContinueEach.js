'use strict';

module.exports = {

    async receive(context) {

        const { correlationId, index: rawIndex } = context.messages.in.content;

        if (!correlationId) {
            throw new context.CancelError('Correlation ID is required!');
        }

        const index = (rawIndex == null || rawIndex === '') ? NaN : Number(rawIndex);
        if (!Number.isInteger(index) || index < 0) {
            throw new context.CancelError('Index is required and must be a non-negative integer!');
        }

        // Acknowledge the item to the Each component that emitted it. The plugin wakes that Each up,
        // which then emits the next item (or 'done' after the last one). See Each/EachSequential.js.
        const result = await context.callAppmixer({
            endPoint: `/plugins/appmixer/utils/controls/${encodeURIComponent(correlationId)}/next`,
            method: 'POST',
            body: { index }
        });

        if (!result?.success) {
            // No sequential loop is waiting under this Correlation ID: the Each is not in sequential
            // mode, or the loop already finished or gave up on this item (item timeout). Not an error -
            // the flow continues either way.
            await context.log({
                step: 'no-loop',
                message: 'Continue Each: no sequential Each loop is waiting for this Correlation ID.'
            });
        }

        return context.sendJson({ correlationId, index }, 'out');
    }
};
