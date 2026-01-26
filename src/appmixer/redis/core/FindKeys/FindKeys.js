'use strict';

const lib = require('../../lib');

const schema = {
    'key': { 'type': 'string', 'title': 'Key' },
    'value': { 'type': 'string', 'title': 'Value' },
    'type': { 'type': 'string', 'title': 'Type' }
};

module.exports = {

    async receive(context) {

        const { pattern, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Keys', value: 'result' });
        }

        if (!pattern) {
            throw new context.CancelError('Pattern is required!');
        }

        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Use SCAN to safely iterate through keys without blocking the server
            const keys = [];
            let cursor = 0;
            const maxKeys = 1000; // Hard limit for safety

            do {
                const result = await client.scan(cursor, { MATCH: pattern });
                const keyNames = result.keys || [];
                cursor = parseInt(result.cursor);

                // Return just key names as strings
                for (const keyName of keyNames) {
                    keys.push(keyName);
                    if (keys.length >= maxKeys) break;
                }

                if (keys.length >= maxKeys) break;
            } while (cursor !== 0);

            return lib.sendArrayOutput({ context, records: keys, outputType });

        } finally {
            await client?.disconnect();
        }
    }
};
