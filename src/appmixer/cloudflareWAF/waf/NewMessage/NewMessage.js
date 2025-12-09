'use strict';

module.exports = {

    async start(context) {

        return context.addListener('message', { customProperties: 'foo' });
    },

    async stop(context) {

        return context.removeListener('message');
    },

    async receive(context) {

        if (context.messages.webhook) {
            await context.sendJson(context.messages.webhook.content.data, 'out');
        }
    }
};
