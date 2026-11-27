'use strict';

const lib = require('../../lib');

const EVENT = 'ticket_created';

// Webhook trigger on a Gorgias HTTP integration (trigger "ticket_created"). The integration posts the ticket ID;
// the trigger reads the ticket back from the API, so the output is the same ticket object as
// Get Ticket returns.
module.exports = {

    async start(context) {

        const { integrationId, secret } = await lib.registerWebhook(context, EVENT);
        return context.saveState({ integrationId, secret });
    },

    async stop(context) {

        const { integrationId } = await context.loadState() || {};
        return lib.unregisterWebhook(context, integrationId);
    },

    async receive(context) {

        if (context.messages.webhook) {
            if (!lib.isAuthenticWebhook(context)) {
                await context.log({ step: 'Ignored a webhook call without the integration secret.' });
                return context.response({ error: 'Forbidden' }, 403);
            }
            const body = lib.webhookBody(context);
            const ticketId = lib.webhookId(body.ticket_id);
            if (!ticketId) {
                await context.log({ step: 'Ignored a webhook call without a ticket ID.', body });
                return context.response();
            }

            const ticket = await lib.getTicket(context, ticketId);
            // Gorgias may deliver an event more than once.
            if (await lib.onceByKey(context, `created-${ticket.id}`)) {
                await context.sendJson(ticket, 'out');
            }
            return context.response();
        }
    },

    // Flow Test Mode: the newest ticket, read the same way receive() reads it.
    async test(context) {

        const ticket = await lib.fetchLatestTicket(context, 'created_datetime');
        if (!ticket) {
            throw new context.CancelError('There is no ticket in this Gorgias account yet. Create one and test again.');
        }
        return context.sendJson(ticket, 'out');
    }
};
