'use strict';

module.exports = {
    async receive(context) {
        const { tagId, name } = context.messages.in.content;

        if (!tagId) {
            throw new context.CancelError('Tag ID is required!');
        }

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        // https://apireference.getresponse.com/#tags
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.getresponse.com/v3/tags/${tagId}`,
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: {
                name: name
            }
        });

        return context.sendJson(data, 'out');
    }
};
