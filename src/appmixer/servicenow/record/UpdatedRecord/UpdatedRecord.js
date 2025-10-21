'use strict';

const eventName = (context) => `${(context.auth.instance)}.${(context.properties.tableName)}.update`;

module.exports = {

    async start(context) {

        context.log({ stage: 'start', eventName: eventName(context) });
        return context.addListener(eventName(context));
    },

    async stop(context) {

        return context.removeListener(eventName(context));
    },

    async receive(context) {

        if (context.messages.webhook) {
            await context.sendJson(context.messages.webhook.content.data, 'out');
        }
    }
};
