'use strict';

module.exports = {
    async receive(context) {
        const { key, apiId } = context.messages.in.content;

        if (!key) {
            throw new context.CancelError('API Key is required!');
        }

        const body = { key };
        if (apiId) body.apiId = apiId;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.unkey.dev/v1/keys.verifyKey',
            headers: {
                'Content-Type': 'application/json'
            },
            data: body
        });

        if (data.valid) {
            return context.sendJson({
                valid: data.valid,
                keyId: data.keyId,
                ownerId: data.ownerId,
                meta: data.meta,
                remaining: data.remaining,
                enabled: data.enabled
            }, 'valid');
        } else {
            return context.sendJson({
                valid: false,
                code: data.code,
                message: data.message
            }, 'invalid');
        }
    }
};
