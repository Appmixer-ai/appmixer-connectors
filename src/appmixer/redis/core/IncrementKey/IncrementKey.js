'use strict';

module.exports = {

    async receive(context) {

        const { key, expire = false, ttl = 60 } = context.messages.in.content;

        if (!key) {
            throw new context.CancelError('Key is required!');
        }

        const lib = require('../../lib');
        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Increment the key value by 1
            const value = await client.incr(key);

            // Set expiration if requested
            if (expire && ttl > 0) {
                await client.expire(key, ttl);
            }

            return context.sendJson({ key, value }, 'out');

        } finally {
            await client?.disconnect();
        }
    }
};
