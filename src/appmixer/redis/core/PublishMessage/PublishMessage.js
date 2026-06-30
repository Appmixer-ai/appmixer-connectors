'use strict';

module.exports = {

    async receive(context) {

        const { channel, message } = context.messages.in.content;

        if (!channel) {
            throw new context.CancelError('Channel is required!');
        }

        if (!message) {
            throw new context.CancelError('Message is required!');
        }

        const lib = require('../../lib');
        let client;

        try {
            client = await lib.createRedisClient(context.auth);

            // Publish message to channel
            // Returns the number of subscribers that received the message
            const subscribers = await client.publish(channel, String(message));

            return context.sendJson({ channel, message, subscribers }, 'out');

        } finally {
            await client?.disconnect();
        }
    }
};
