'use strict';

module.exports = {

    async receive(context) {

        const { key, keyType = 'automatic' } = context.messages.in.content;

        if (!key) {
            throw new context.CancelError('Key is required!');
        }

        const lib = require('../../lib');
        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Get the actual type if using automatic detection
            let actualType = keyType;
            if (keyType === 'automatic') {
                actualType = await client.type(key);
            }

            // Get the value using lib helper
            const value = await lib.getValue(client, key, keyType);

            return context.sendJson({
                key,
                value,
                type: actualType
            }, 'out');

        } finally {
            await client?.disconnect();
        }
    }
};
