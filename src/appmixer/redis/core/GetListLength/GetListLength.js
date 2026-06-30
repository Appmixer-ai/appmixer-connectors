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

            // Get list length
            const length = await client.lLen(key);

            return context.sendJson({ key, length }, 'out');

        } finally {
            await client?.disconnect();
        }
    }
};
