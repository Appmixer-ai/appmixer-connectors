'use strict';

module.exports = {

    async receive(context) {

        const { key, side = 'left' } = context.messages.in.content;

        if (!key) {
            throw new context.CancelError('Key is required!');
        }

        const lib = require('../../lib');
        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Pop from the specified side
            let value;
            if (side === 'left') {
                value = await client.lPop(key);
            } else {
                value = await client.rPop(key);
            }

            return context.sendJson({ key, value }, 'out');

        } finally {
            await client?.disconnect();
        }
    }
};
