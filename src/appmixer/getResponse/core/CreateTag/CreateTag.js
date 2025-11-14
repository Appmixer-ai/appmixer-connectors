'use strict';

module.exports = {
    async receive(context) {
        const { name } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Tag Name is required!');
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.getresponse.com/v3/tags',
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: {
                name: name
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
