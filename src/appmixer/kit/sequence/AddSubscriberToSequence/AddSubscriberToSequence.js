'use strict';

module.exports = {
    async receive(context) {

        const { sequenceId, subscriberId } = context.messages.in.content;

        // Validate required input
        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }

        if (!sequenceId) {
            throw new context.CancelError('Sequence ID is required!');
        }

        // https://developers.kit.com/api-reference/sequences/add-subscriber-to-sequence
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.kit.com/v4/sequences/${sequenceId}/subscribers/${subscriberId}`,
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            }
        });

        return context.sendJson(data.subscriber, 'out');
    }
};

