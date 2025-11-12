'use strict';

module.exports = {
    async receive(context) {
        const { apiId, ownerId, outputType } = context.messages.in.content;

        if (!apiId) {
            throw new context.CancelError('API ID is required!');
        }

        const params = {
            apiId,
            limit: 100
        };

        if (ownerId) {
            params.ownerId = ownerId;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.unkey.dev/v1/keys.listKeys',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            params
        });

        const keys = data.keys || [];

        if (outputType === 'first') {
            if (keys.length === 0) {
                throw new context.CancelError('No keys available for first output type');
            }
            await context.sendJson(
                { ...keys[0], index: 0, count: keys.length },
                'out'
            );
        } else if (outputType === 'object') {
            for (let index = 0; index < keys.length; index++) {
                await context.sendJson(
                    { ...keys[index], index, count: keys.length },
                    'out'
                );
            }
        } else {
            // array is default
            await context.sendJson({ keys, count: keys.length }, 'out');
        }
    }
};
