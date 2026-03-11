'use strict';

const api = require('../../api');

module.exports = {
    async start(context) {
        const { publicationId } = context.properties;
        const result = await api.Create8.execute(context, {
            publicationId,
            url: context.getWebhookUrl(),
            event_types: ['subscription.upgraded']
        });
        await context.saveState({ webhookId: result.data.id });
    },

    async stop(context) {
        const { webhookId } = context.state;
        if (!webhookId) return;
        const { publicationId } = context.properties;
        try {
            await api.Delete5.execute(context, { publicationId, endpointId: webhookId });
        } catch (err) {
            // Webhook may already be deleted
        }
        await context.saveState({ webhookId: null });
    },

    async receive(context) {
        const data = context.messages.webhook.content.data;
        await context.sendJson({ data }, 'out');
        return context.response();
    }
};
