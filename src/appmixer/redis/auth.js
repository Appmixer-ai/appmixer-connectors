'use strict';

const { createClient } = require('redis');

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            url: {
                type: 'text',
                name: 'Redis URL',
                tooltip: 'The Redis connection URL (e.g., rediss://default:password@host:port)',
                required: true
            }
        },

        // Extract host from URL for account name
        accountNameFromProfileInfo: (context) => {
            try {
                const urlObj = new URL(context.url);
                return urlObj.username + '@' + urlObj.hostname;
            } catch {
                return context.url;
            }
        },

        validate: async (context) => {
            const client = createClient({
                url: context.url
            });

            await client.connect();
            try {
                await client.ping();
                return true;
            } catch (err) {
                throw err;
            } finally {
                await client?.disconnect();
            }
        }
    }
};
