'use strict';

module.exports = {
    async receive(context) {
        const { keyId, op, value } = context.messages.in.content;

        if (!keyId) {
            throw new context.CancelError('Key ID is required!');
        }

        if (!op) {
            throw new context.CancelError('Operation is required!');
        }

        if (value === undefined || value === null) {
            throw new context.CancelError('Value is required!');
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.unkey.dev/v1/keys.updateRemaining',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                keyId,
                op,
                value
            }
        });

        return context.sendJson({
            remaining: data.remaining
        }, 'out');
    }
};
