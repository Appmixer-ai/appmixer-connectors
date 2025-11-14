'use strict';

module.exports = {
    async receive(context) {
        const { tagId } = context.messages.in.content;

        if (!tagId) {
            throw new context.CancelError('Tag ID is required!');
        }

        // https://apireference.getresponse.com/#tags
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.getresponse.com/v3/tags/${tagId}`,
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
