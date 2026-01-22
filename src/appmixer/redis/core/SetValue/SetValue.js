'use strict';

module.exports = {

    async receive(context) {

        const { key, value, keyType = 'automatic', expire = false, ttl = 60 } = context.messages.in.content;

        if (!key) {
            throw new context.CancelError('Key is required!');
        }

        if (value === undefined || value === null) {
            throw new context.CancelError('Value is required!');
        }

        const lib = require('../../lib');
        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Determine if value is JSON (for hash type)
            let valueIsJSON = false;
            if (keyType === 'hash' && typeof value === 'string') {
                try {
                    JSON.parse(value);
                    valueIsJSON = true;
                } catch (e) {
                    // Not JSON, will be treated as regular value
                }
            }

            // Set the value using lib helper
            await lib.setValue(client, key, value, expire, ttl, keyType, valueIsJSON);

            return context.sendJson({ key, value }, 'out');

        } finally {
            await client?.disconnect();
        }
    }
};
