'use strict';

const lib = require('../../lib');

const EVENTS = ['WorkbookUpdated'];

// The webhook payload carries IDs only, so the item is read from the API.
async function toOutput(context, item, event) {

    return { ...lib.mapWorkbook(item), eventType: event.eventType, eventCreatedAt: event.createdAt };
}

module.exports = {

    async start(context) {

        return lib.registerWebhooks(context, EVENTS);
    },

    async stop(context) {

        const { webhookIds } = await context.loadState();
        return lib.unregisterWebhooks(context, webhookIds);
    },

    async receive(context) {

        if (context.messages.webhook) {
            try {
                const event = await lib.readWebhookEvent(context, EVENTS);
                if (event) {
                    const { data } = await lib.apiRequest(context, { path: '/workbooks/' + lib.encodeId(event.resourceId) });
                    await context.sendJson(await toOutput(context, data.workbook, event), 'out');
                }
            } finally {
                // Acknowledge even when the emit failed: Tableau retries non-2xx deliveries and
                // disables a webhook after repeated failures.
                await context.response();
            }
        }
    },

    async test(context) {

        const { data } = await lib.apiRequest(context, { path: '/workbooks', params: { pageSize: 1, sort: 'updatedAt:desc' } });
        const item = lib.toList(data.workbooks, 'workbook')[0];
        if (!item) {
            throw new context.CancelError('There is no workbook on the site yet. Publish one to Tableau to see the output of this trigger.');
        }
        return context.sendJson(await toOutput(context, item, { eventType: 'WorkbookUpdated', createdAt: item.updatedAt }), 'out');
    }
};
