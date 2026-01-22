'use strict';

module.exports = {

    async receive(context) {

        const { pattern, getValues = false } = context.messages.in.content;

        if (!pattern) {
            throw new context.CancelError('Pattern is required!');
        }

        const lib = require('../../lib');
        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Find keys matching the pattern
            const keyNames = await client.keys(pattern);

            // Optionally get values for each key
            if (getValues && keyNames.length > 0) {
                const keys = [];
                for (const keyName of keyNames) {
                    const value = await lib.getValue(client, keyName, 'automatic');
                    const type = await client.type(keyName);
                    keys.push({
                        key: keyName,
                        value,
                        type
                    });
                }
                return context.sendJson({ keys }, 'out');
            }

            // Return just key names
            const keys = keyNames.map(key => ({ key }));
            return context.sendJson({ keys }, 'out');

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
