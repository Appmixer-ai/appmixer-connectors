'use strict';

const lib = require('../../lib');

const EVENT = 'recipient_completed';

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

    // Flow Test Mode: the last completed document, as Document Details returns it. The REST API
    // does not say which recipient acted last, so action_by and action_date are not included.
    // Read-only.
    async test(context) {

        const event = await lib.fetchLatestExample(context, EVENT, {
            status: lib.DOCUMENT_STATUS_CODES['document.completed'],
            order_by: '-date_completed'
        });
        if (!event) {
            throw new context.CancelError('No completed document in this PandaDoc workspace yet. '
                + 'Have a recipient sign a document and test again.');
        }
        return context.sendJson(event, 'out');
    }
};
