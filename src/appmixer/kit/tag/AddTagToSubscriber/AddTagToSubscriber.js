'use strict';

module.exports = {
    async receive(context) {

        const { tagId, subscriberId } = context.messages.in.content;

        // Validate required input
        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }

        if (!tagId) {
            throw new context.CancelError('Tag ID is required!');
        }

        // https://developers.kit.com/api-reference/tags/tag-a-subscriber
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.kit.com/v4/tags/${tagId}/subscribers/${subscriberId}`,
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            }
        });

        return context.sendJson(data.subscriber, 'out');
    }
};

