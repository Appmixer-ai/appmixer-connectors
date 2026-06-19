'use strict';

const lib = require('../../lib');

// See NewMessage.js for the model — same lifecycle, just listens on the
// `statuses:<wabaId>` event channel instead.

module.exports = {

    // Flow Test Mode: the WhatsApp Cloud API has no endpoint to list past status
    // updates, so emit a representative status in the exact shape routes.js maps a
    // status into for this trigger.
    async test(context) {

        const wabaId = (context.properties && context.properties.businessAccountId)
            || lib.resolveWabaId(context);
        if (!wabaId) {
            throw new context.CancelError(
                'No WhatsApp Business Account ID to build test data. Fill the inspector '
                + 'field or reconnect the WhatsApp account.'
            );
        }

        return context.sendJson({
            id: 'wamid.TEST' + Date.now(),
            recipientId: '15551234567',
            status: 'delivered',
            timestamp: String(Math.floor(Date.now() / 1000)),
            conversation: { id: 'TEST_CONVERSATION', origin: { type: 'service' } },
            wabaId,
            phoneNumberId: '000000000000000'
        }, 'status');
    },

    async start(context) {

        // Form override (inspector input) wins over the auto-discovered default
        // from the OAuth profile.
        const wabaId = (context.properties && context.properties.businessAccountId)
            || lib.resolveWabaId(context);

        if (!wabaId) {
            throw new context.CancelError(
                'No WhatsApp Business Account ID. Either fill the inspector field, ' +
                'or reconnect the WhatsApp account so the WABA is discovered automatically.'
            );
        }

        try {
            await lib.subscribeWabaApp(context, wabaId);
        } catch (err) {
            // Continue — Meta may already be subscribed.
        }

        await context.addListener(`statuses:${wabaId}`, {
            wabaId,
            accessToken: context.auth.accessToken
        });

        await context.saveState({ wabaId });
    },

    async stop(context) {

        const state = await context.loadState();
        const wabaId = (state && state.wabaId) || lib.resolveWabaId(context);
        if (!wabaId) return;

        await context.removeListener(`statuses:${wabaId}`);
    },

    async receive(context) {

        if (!context.messages.webhook) return;

        const data = context.messages.webhook.content && context.messages.webhook.content.data;
        if (!data) return;

        await context.sendJson(data, 'status');
    }
};
