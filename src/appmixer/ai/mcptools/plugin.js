'use strict';

const lib = require('./lib');

module.exports = async context => {

    context.log('info', '[AI.MCPTOOLS] Initializing plugin.');

    // Keep a connection to Redis for publish/subscribe that we use to deliver
    // MCP gateway events to clients in real-time.
    if (!process.CONNECTOR_STREAM_PUB_CLIENT) {
        context.log('info', '[AI.MCPTOOLS] Connecting Redis Publisher client.');
        process.CONNECTOR_STREAM_PUB_CLIENT = await lib.connectRedis();
        context.log('info', '[AI.MCPTOOLS] Redis Publisher client connected.');
    }
    if (!process.CONNECTOR_STREAM_SUB_CLIENT) {
        context.log('info', '[AI.MCPTOOLS] Connecting Redis Subscriber client.');
        process.CONNECTOR_STREAM_SUB_CLIENT = await lib.connectRedis();
        context.log('info', '[AI.MCPTOOLS] Redis Subscriber client connected.');
    } else {
        // Remove all existing listeners to prevent duplicates when plugin re-initializes.
        process.CONNECTOR_STREAM_SUB_CLIENT.removeAllListeners();
    }
    require('./routes')(context);
    context.log('info', '[AI.MCPTOOLS] plugin initialized.');
};
