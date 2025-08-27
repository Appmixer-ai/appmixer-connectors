const OpenAI = require('openai');
const Redis = require('ioredis');
const fs = require('fs').promises;

module.exports = {

    request: async function(context, method, endpoint, data, options = {}, extraHeaders = {}) {

        const baseUrl = context.config.llmBaseUrl || 'https://api.openai.com/v1';
        const url = baseUrl + endpoint;
        const headers = {
            'Authorization': `Bearer ${context.apiKey || context.auth.apiKey}`,
            'Content-Type': 'application/json',
            ...extraHeaders
        };
        if (context.config.llmDefaultHeaders) {
            const defaultHeaders = JSON.parse(context.config.llmDefaultHeaders);
            Object.keys(defaultHeaders).forEach(key => {
                headers[key] = defaultHeaders[key];
            });
        }
        if (method === 'get' || method === 'delete') {
            return context.httpRequest[method](url, { headers });
        } else {
            return context.httpRequest[method](url, data, {
                headers,
                ...options
            });
        }
    },

    sdk: function(context) {

        const apiKey = context.apiKey || context.auth.apiKey;
        const opt = { apiKey };
        if (context.config.llmBaseUrl) {
            // Allow for re-using the OpenAI connector with different OpenAI compatible LLMs.
            // For example, for OpenRouter, set 'https://openrouter.ai/api/v1'.
            opt.baseUrl = context.config.llmBaseUrl;
        }
        if (context.config.llmDefaultHeaders) {
            // For example, for OpenRouter, set:
            // {
            //    "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
            //    "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
            // }
            try {
                opt.defaultHeaders = JSON.parse(context.config.llmDefaultHeaders);
            } catch (err) {
                throw new Error('Invalid JSON in config.llmDefaultHeaders: ' + err.message);
            }
        }
        return new OpenAI(opt);
    },

    toFile: OpenAI.toFile,

    formatBytes: function(bytes, decimals = 2) {

        if (!+bytes) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    publish: async function(channel, event) {

        let redisPub = process.CONNECTOR_STREAM_PUB_CLIENT;
        if (!redisPub) {
            redisPub = process.CONNECTOR_STREAM_PUB_CLIENT = await this.connectRedis();
        }
        return redisPub.publish(channel, JSON.stringify(event));
    },

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
                ca: connection.caPath ? await fs.readFile(connection.caPath) : undefined
            };
        }

        let client;

        if (connection.mode === 'replica' && connection.sentinels) {

            const sentinelsArray = connection.sentinels.split(',');

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
