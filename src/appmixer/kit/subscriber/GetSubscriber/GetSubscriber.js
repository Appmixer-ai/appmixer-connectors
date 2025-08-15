
'use strict';

module.exports = {
    async receive(context) {

        const { subscriberId } = context.messages.in.content;

        // Validate required input
        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }

        // https://developers.kit.com/api-reference/subscribers/get-a-subscriber
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.kit.com/v4/subscribers/${subscriberId}`,
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            }
        });

        return context.sendJson(data.subscriber, 'out');
    }
};

