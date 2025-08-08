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

        // https://developers.kit.com/api-reference/tags/remove-tag-from-subscriber
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.kit.com/v4/tags/${tagId}/subscribers/${subscriberId}`,
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            }
        });

        return context.sendJson({}, 'out');
    }
};

