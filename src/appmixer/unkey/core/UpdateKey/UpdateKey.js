'use strict';

module.exports = {
    async receive(context) {
        const {
            keyId,
            name,
            externalId,
            expires,
            enabled
        } = context.messages.in.content;

        if (!keyId) {
            throw new context.CancelError('Key ID is required!');
        }

        const body = {
            keyId
        };

        if (name !== undefined && name !== null) body.name = name;
        if (externalId !== undefined && externalId !== null) body.externalId = externalId;
        if (expires !== undefined && expires !== null) body.expires = new Date(expires).getTime();
        if (typeof enabled === 'boolean') body.enabled = enabled;

        await context.httpRequest({
            method: 'POST',
            url: 'https://api.unkey.com/v2/keys.updateKey',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson({}, 'out');
    }
};
