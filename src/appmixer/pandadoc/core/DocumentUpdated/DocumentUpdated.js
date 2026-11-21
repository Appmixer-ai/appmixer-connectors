'use strict';

const lib = require('../../lib');

const EVENT = 'document_updated';

module.exports = {

    async start(context) {

        const { webhookId, token, sharedKey } = await lib.registerWebhook(context, EVENT);
        return context.saveState({ webhookId, token, sharedKey });
    },

    async stop(context) {

        const { webhookId } = await context.loadState() || {};
        return lib.unregisterWebhook(context, webhookId);
    },

    async receive(context) {

        if (context.messages.webhook) {
            return lib.receiveWebhook(context, EVENT);
        }
    },

    // Flow Test Mode: the last modified draft document, as Document Details returns it.
    // Read-only.
    async test(context) {

        const event = await lib.fetchLatestExample(context, EVENT, {
            status: lib.DOCUMENT_STATUS_CODES['document.draft'],
            order_by: '-date_modified'
        });
        if (!event) {
            throw new context.CancelError('No draft document in this PandaDoc workspace yet. '
                + 'Create a document, or move a sent document back to draft, and test again.');
        }
        return context.sendJson(event, 'out');
    }
};
