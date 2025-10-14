'use strict';
const uuid = require('uuid');

module.exports = {

    async start(context) {

        const timeSlots = context.properties.timeSlots?.AND;
        await context.callAppmixer({
            endPoint: '/plugins/appmixer/utils/timers/throttle-configs',
            method: 'PATCH',
            body: {
                ...context.properties,
                name: context.componentId,
                timeSlots
            }
        });
    },

    async stop(context) {

        const { messageQueue } = context.properties;

        // Remove the config from DB. If later we want to make shared configs, it should just remove
        // the queue from the config queues
        await context.callAppmixer({
            endPoint: '/plugins/appmixer/utils/timers/throttle-configs',
            method: 'DELETE',
            body: {
                name: context.componentId
            }
        });

        // Clear the message queue
        await context.store.clear(messageQueue);
    },

    async receive(context) {

        if (context.messages.webhook) {
            await context.sendJson(context.messages.webhook.content.data, 'out');
            return context.response();
        }

        const { messageQueue } = context.properties;
        const key = uuid.v4();
        await context.store.set(messageQueue, key, {
            webhookUrl: context.getWebhookUrl(),
            flowId: context.flowId,
            componentId: context.componentId,
            correlationId: context.messages.in.correlationId,
            content: context.messages.in.originalContent
        });
    }
};
