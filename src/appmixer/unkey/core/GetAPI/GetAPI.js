'use strict';

module.exports = {
    async receive(context) {
        const { apiId } = context.messages.in.content;

        if (!apiId) {
            throw new context.CancelError('API ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.unkey.dev/v1/apis.getApi',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            params: {
                apiId
            }
        });

        return context.sendJson(data, 'out');
    }
};
