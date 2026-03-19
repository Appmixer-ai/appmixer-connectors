'use strict';

const Redis = require('ioredis');
const fs = require('fs');

module.exports = {

    connectRedis: async function() {

        const connection = {
            uri: process.env.REDIS_URI,
            mode: process.env.REDIS_MODE || 'standalone',
            sentinels: process.env.REDIS_SENTINELS,
            sentinelMasterName: process.env.REDIS_SENTINEL_MASTER_NAME,
            sentinelRedisPassword: process.env.REDIS_SENTINEL_PASSWORD,
            enableTLSForSentinelMode: process.env.REDIS_SENTINEL_ENABLE_TLS,
            caPath: process.env.REDIS_CA_PATH,
            useSSL: process.env.REDIS_USE_SSL === 'true' || parseInt(process.env.REDIS_USE_SSL) > 0
        };

        const options = {};
        if (connection.useSSL) {
            options.tls = {
                ca: connection.caPath ? await fs.promises.readFile(connection.caPath).catch(err => {
                    throw new Error(`Failed to read Redis CA certificate from ${connection.caPath}: ${err.message}`);
                }) : undefined
            };
        }

        let client;

        if (connection.mode === 'replica' && connection.sentinels) {

            const sentinelsArray = connection.sentinels.split(',').map(s => s.trim()).filter(s => s);
            if (sentinelsArray.length === 0) {
                throw new Error('REDIS_SENTINELS must contain at least one sentinel address');
            }

            client = new Redis({
                sentinels: sentinelsArray,
                name: connection.sentinelMasterName,
                ...(connection.sentinelRedisPassword ? { password: connection.sentinelRedisPassword } : {}),
                ...(connection.enableTLSForSentinelMode ?
                    { enableTLSForSentinelMode: connection.enableTLSForSentinelMode } : {})
            });
        } else {
            client = connection.uri ? new Redis(connection.uri, options) : new Redis();
        }

        return client;
    }
};
