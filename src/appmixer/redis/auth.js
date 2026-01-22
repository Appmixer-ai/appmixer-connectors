'use strict';

const { createClient } = require('redis');

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            host: {
                type: 'text',
                name: 'Host',
                tooltip: 'The hostname or IP address of your Redis server.',
                required: true
            },
            port: {
                type: 'number',
                name: 'Port',
                tooltip: 'The port number of your Redis server (default: 6379).',
                defaultValue: 6379
            },
            database: {
                type: 'number',
                name: 'Database',
                tooltip: 'The Redis database number to connect to (default: 0).',
                defaultValue: 0
            },
            username: {
                type: 'text',
                name: 'Username',
                tooltip: 'Username for Redis authentication (optional, for Redis 6+ ACL).',
                required: true
            },
            password: {
                type: 'text',
                name: 'Password',
                tooltip: 'Password for Redis authentication.',
                required: true
            }
        },


        // Specify which key to use as account name for Appmixer
        accountNameFromProfileInfo: 'host',

        validate: async (context) => {
            const client = createClient({
                username: context.username,
                password: context.password,
                socket: {
                    host: context.host,
                    port: context.port ? Number.parseInt(context.port, 10) : 6379
                },
                database: context.database ? Number.parseInt(context.database, 10) : 0
            });

            await client.connect();
            try {
                await client.ping();
                return true;
            } catch (err) {
                throw err;
            } finally {
                await client.disconnect();
            }
        }
    }
};
