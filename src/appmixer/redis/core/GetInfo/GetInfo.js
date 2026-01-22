'use strict';

module.exports = {

    async receive(context) {

        const lib = require('../../lib');
        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Get Redis server info
            const infoString = await client.info();

            // Convert info string to structured object
            const info = lib.convertInfoToObject(infoString);

            return context.sendJson({ info }, 'out');

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
