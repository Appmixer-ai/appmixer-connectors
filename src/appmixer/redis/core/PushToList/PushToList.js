'use strict';

module.exports = {

    async receive(context) {

        const { key, value, side = 'left' } = context.messages.in.content;

        if (!key) {
            throw new context.CancelError('Key is required!');
        }

        if (!value) {
            throw new context.CancelError('Value is required!');
        }

        const lib = require('../../lib');
        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Push to the specified side
            let length;
            if (side === 'left') {
                length = await client.lPush(key, String(value));
            } else {
                length = await client.rPush(key, String(value));
            }

            return context.sendJson({ key, length }, 'out');

        } finally {
            await client?.disconnect();
        }
    }
};
