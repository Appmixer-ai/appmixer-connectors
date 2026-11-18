'use strict';

const lib = require('../../lib');

const TRIGGER_EVENT = 'BOOKING_CREATED';

module.exports = {

    async start(context) {

        const { webhookId, secret } = await lib.registerWebhook(context, TRIGGER_EVENT);
        return context.saveState({ webhookId, secret });
    },

    async stop(context) {

        const { webhookId } = await context.loadState() || {};
        return lib.unregisterWebhook(context, webhookId);
    },

    async receive(context) {

        if (context.messages.webhook) {
            return lib.receiveWebhook(context, TRIGGER_EVENT);
        }
    },

    // Flow Test Mode: the newest matching booking, reshaped into the webhook payload.
    async test(context) {

        const booking = await lib.fetchLatestExample(context, TRIGGER_EVENT);
        if (!booking) {
            throw new context.CancelError('No booking in this Cal.com account matches ' + TRIGGER_EVENT + ' yet. '
                + 'Make the event happen in Cal.com once and test again.');
        }
        return context.sendJson(lib.toWebhookShape(booking, TRIGGER_EVENT), 'out');
    }
};
