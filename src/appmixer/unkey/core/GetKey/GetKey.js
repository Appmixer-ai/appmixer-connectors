'use strict';

module.exports = {
    async receive(context) {
        const { keyId } = context.messages.in.content;

        if (!keyId) {
            throw new context.CancelError('Key ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.unkey.dev/v1/keys.getKey',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            params: {
                keyId
            }
        });

        return context.sendJson(data, 'out');
    }
};
