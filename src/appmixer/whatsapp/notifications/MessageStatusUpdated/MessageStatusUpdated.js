'use strict';

const lib = require('../../lib');

// See NewMessage.js for the model — same lifecycle, just listens on the
// `statuses:<wabaId>` event channel instead.

module.exports = {

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
