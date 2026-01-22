'use strict';

module.exports = {

    async start(context) {

        const { channels, parseJSON = false, onlyMessage = false } = context.properties;

        if (!channels) {
            throw new context.CancelError('Channels is required!');
        }

        const lib = require('../../lib');

        // Parse channel patterns (comma-separated)
        const channelPatterns = channels.split(',').map(c => c.trim()).filter(c => c);

        if (channelPatterns.length === 0) {
            throw new context.CancelError('At least one channel pattern is required!');
        }

        // Create a dedicated client for subscription
        const client = await lib.createRedisClient(context.auth);

        // Set up message handler
        const messageHandler = (message, channel) => {
            let messageContent = message;

            // Try to parse JSON if requested
            if (parseJSON) {
                try {
                    messageContent = JSON.parse(message);
                } catch (e) {
                    // Keep as string if parsing fails
                }
            }

            // Send output
            if (onlyMessage) {
                context.sendJson({ message: messageContent }, 'out');
            } else {
                context.sendJson({ channel, message: messageContent }, 'out');
            }
        };

        // Subscribe to pattern-based channels
        await client.pSubscribe(channelPatterns, messageHandler);

        // Store client reference for cleanup
        await context.saveState({ subscribed: true });
        context.redisClient = client;
    },

    async stop(context) {

        const client = context.redisClient;

        if (client) {
            try {
                // Unsubscribe from all patterns
                await client.pUnsubscribe();
                await client.quit();
            } catch (e) {
                try {
                    await client.disconnect();
                } catch (disconnectError) {
                    // Ignore disconnect errors
                }
            }
        }

        await context.saveState({});
    }
};
