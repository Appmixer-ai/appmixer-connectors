'use strict';

const lib = require('../../lib');

const schema = {
    'key': { 'type': 'string', 'title': 'Key' },
    'value': { 'type': 'string', 'title': 'Value' },
    'type': { 'type': 'string', 'title': 'Type' }
};

module.exports = {

    async receive(context) {

        const { pattern, getValues = false, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Keys', value: 'result' });
        }

        if (!pattern) {
            throw new context.CancelError('Pattern is required!');
        }

        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Find keys matching the pattern
            const keyNames = await client.keys(pattern);

            // Optionally get values for each key
            let keys = [];
            if (getValues && keyNames.length > 0) {
                for (const keyName of keyNames) {
                    const value = await lib.getValue(client, keyName, 'automatic');
                    const type = await client.type(keyName);
                    keys.push({
                        key: keyName,
                        value: JSON.stringify(value),
                        type
                    });
                }
            } else {
                // Return just key names
                keys = keyNames.map(key => ({ key, value: null, type: null }));
            }

            return lib.sendArrayOutput({ context, records: keys, outputType });

        } finally {
            await client?.disconnect();
        }
    }
};
