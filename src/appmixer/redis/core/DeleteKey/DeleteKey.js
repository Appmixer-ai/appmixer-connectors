'use strict';

module.exports = {

    async receive(context) {

        const { key } = context.messages.in.content;

        if (!key) {
            throw new context.CancelError('Key is required!');
        }

        const lib = require('../../lib');
        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Delete the key(s)
            const deletedCount = await client.del(key);

            return context.sendJson({ deletedCount }, 'out');

        } finally {
            if (client) {
                try {
                    await client.quit();
                } catch (e) {
                    await client.disconnect();
                }
            }
        }
    }
};
