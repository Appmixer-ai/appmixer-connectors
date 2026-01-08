'use strict';

module.exports = {
    async receive(context) {
        const { keyId } = context.messages.in.content;

        if (!keyId) {
            throw new context.CancelError('Key ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.unkey.com/v2/keys.getKey',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                keyId
            }
        });

        return context.sendJson(data.data, 'out');
    }
};
