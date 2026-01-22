'use strict';

const lib = require('../../lib');

module.exports = {

    async start(context) {

        const { channels, parse_json: parseJSON = false, only_message: onlyMessage = false } = context.properties;

        if (!channels) {
            throw new context.CancelError('Channels is required!');
        }

        // Parse channel patterns (comma-separated)
        const channelPatterns = channels.split(',').map(c => c.trim()).filter(c => c);

        if (channelPatterns.length === 0) {
            throw new context.CancelError('At least one channel pattern is required!');
        }

        try {
            // Create a dedicated client for subscription
            const client = await lib.createRedisClient(context.auth);

            // Set up message handler for pattern subscriptions
            const messageHandler = async (message, channel) => {
                let messageContent = message;

                // Try to parse JSON if requested
                if (parseJSON) {
                    try {
                        messageContent = JSON.parse(message);
                    } catch (e) {
                        // Keep as string if parsing fails
                    }
                }

                // Prepare output
                const output = onlyMessage
                    ? { message: messageContent }
                    : { channel, message: messageContent };

                await context.sendJson(output, 'out');
            };

            // Subscribe to pattern-based channels
            await client.pSubscribe(channelPatterns, messageHandler);

            // Store client reference and configuration for cleanup
            await context.saveState({
                subscribed: true,
                channels: channelPatterns
            });

            // Store client in context for webhook and stop methods
            context.redisClient = client;
        } catch (err) {
            context.log({ stage: 'Error starting OnMessage trigger', error: err.message });
            throw new context.CancelError(`Failed to subscribe to channels: ${err.message}`);
        }
    },

    async receive(context) {

        // Handle webhook messages if needed
        if (context.messages.webhook) {
            // Process webhook payload
            const payload = context.messages.webhook.content.data;
            const message = payload.message || payload;

            await context.sendJson(message, 'out');

            // Acknowledge webhook
            return context.response();
        }
    },

    async stop(context) {

        const client = context.redisClient;

        if (client) {
            try {
                // Unsubscribe from all patterns
                await client.pUnsubscribe();
            } catch (e) {
                context.log({ stage: 'Error unsubscribing', error: e.message });
            }

                await client?.disconnect();
        }

        await context.saveState({});
    }
};
