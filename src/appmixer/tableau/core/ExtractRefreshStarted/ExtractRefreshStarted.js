'use strict';

const lib = require('../../lib');

const EVENTS = { workbook: 'WorkbookRefreshStarted', datasource: 'DatasourceRefreshStarted' };

function selectedEvents(context) {

    const { contentType } = context.properties;
    return EVENTS[contentType] ? [EVENTS[contentType]] : [EVENTS.workbook, EVENTS.datasource];
}

module.exports = {

    async start(context) {

        return lib.registerWebhooks(context, selectedEvents(context));
    },

    async stop(context) {

        const { webhookIds } = await context.loadState();
        return lib.unregisterWebhooks(context, webhookIds);
    },

    async receive(context) {

        if (context.messages.webhook) {
            try {
                const event = await lib.readWebhookEvent(context, selectedEvents(context));
                if (event) {
                    await context.sendJson(event, 'out');
                }
            } finally {
                // Acknowledge even when the emit failed: Tableau retries non-2xx deliveries and
                // disables a webhook after repeated failures.
                await context.response();
            }
        }
    },

    async test(context) {

        // Tableau keeps no history of webhook events that could be read back as an example.
        throw new context.CancelError('Tableau has no API to read past extract refresh events. '
            + 'Start the flow and refresh an extract in Tableau (or run Refresh Workbook Extract) to see a real event.');
    }
};
