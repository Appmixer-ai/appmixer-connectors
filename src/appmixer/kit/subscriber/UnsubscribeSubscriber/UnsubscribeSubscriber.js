'use strict';

module.exports = {
    async receive(context) {

        const { subscriberId } = context.messages.in.content;

        // Validate required input
        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }

        // https://developers.kit.com/api-reference/subscribers/unsubscribe-subscriber
        await context.httpRequest({
            method: 'POST',
            url: `https://api.kit.com/v4/subscribers/${subscriberId}/unsubscribe`,
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            }
        });

        // Unsubscribe API returns empty response, so we return empty object
        return context.sendJson({}, 'out');
    }
};

