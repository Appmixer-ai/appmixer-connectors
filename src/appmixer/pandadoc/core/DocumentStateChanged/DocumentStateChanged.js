'use strict';

const lib = require('../../lib');

const EVENT = 'document_state_changed';

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
            const { status } = context.properties;
            return lib.receiveWebhook(context, EVENT, status ? (data) => data.status === status : undefined);
        }
    },

    // Flow Test Mode: the document whose status changed last (with the configured status),
    // as Document Details returns it - the data document webhooks carry. Read-only.
    async test(context) {

        const { status } = context.properties;
        const params = { order_by: '-date_status_changed' };
        if (status) {
            params.status = lib.DOCUMENT_STATUS_CODES[status];
        }
        const event = await lib.fetchLatestExample(context, EVENT, params);
        if (!event) {
            throw new context.CancelError('No document in this PandaDoc workspace matches the trigger yet. '
                + 'Create or send a document in PandaDoc and test again.');
        }
        return context.sendJson(event, 'out');
    }
};
