import type { AppmixerContext } from '../../types';

const api = require('../../api.ts');

module.exports = {
    async start(context: AppmixerContext): Promise<void> {
        const { publicationId } = context.properties as { publicationId: string };
        const result = await api.Create8.execute(context, {
            publicationId,
            url: context.getWebhookUrl(),
            event_types: ['subscription.deleted']
        });
        await context.saveState({ webhookId: (result as { data: { id: string } }).data.id });
    },

    async stop(context: AppmixerContext): Promise<void> {
        const { webhookId } = context.state as { webhookId: string | null };
        if (!webhookId) return;
        const { publicationId } = context.properties as { publicationId: string };
        try {
            await api.Delete5.execute(context, { publicationId, endpointId: webhookId });
        } catch (err) {
            // Webhook may already be deleted
        }
        await context.saveState({ webhookId: null });
    },

    async receive(context: AppmixerContext): Promise<void> {
        const data = context.messages.webhook!.content.data;
        await context.sendJson({ data }, 'out');
        return context.response();
    }
};
