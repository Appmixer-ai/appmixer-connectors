'use strict';

module.exports = {
    async receive(context) {
        const { apiId } = context.messages.in.content;

        if (!apiId) {
            throw new context.CancelError('API ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.unkey.com/v2/apis.getApi',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                apiId
            }
        });

        return context.sendJson(data.data, 'out');
    }
};
