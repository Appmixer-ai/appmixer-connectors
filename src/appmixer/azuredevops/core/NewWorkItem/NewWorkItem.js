'use strict';

const api = require('../../api');

module.exports = {

    async start(context) {

        const { organization, projectId } = context.properties;
        const webhookUrl = context.getWebhookUrl();

        const subscription = await api.CreateSubscription.execute(context, {
            organization,
            projectId,
            eventType: 'workitem.created',
            webhookUrl
        });

        return context.saveState({ subscriptionId: subscription.id });
    },

    async receive(context) {

        if (context.messages.webhook) {
            const payload = context.messages.webhook.content.data;
            const { workItemType } = context.properties;

            // Apply optional work item type filter
            if (workItemType && payload.resource && payload.resource.fields) {
                const itemType = payload.resource.fields['System.WorkItemType'];
                if (itemType && itemType.toLowerCase() !== workItemType.toLowerCase()) {
                    return context.response();
                }
            }

            await context.sendJson(payload, 'out');
            return context.response();
        }
    },

    async stop(context) {

        const state = await context.loadState();
        const { subscriptionId } = state;

        if (subscriptionId) {
            const { organization } = context.properties;
            try {
                await api.DeleteSubscription.execute(context, { organization, subscriptionId });
            } catch (err) {
                // Log but don't throw — allow flow to stop cleanly even if webhook cleanup fails
                await context.log({ step: 'DeleteSubscription failed', subscriptionId, err: err.message });
            }
        }
    }
};
