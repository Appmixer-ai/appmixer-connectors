'use strict';

const lib = require('../../lib');

const EVENT = 'ticket_message_created';

/**
 * The message the event is about. The integration posts the ticket ID and the message ID; when
 * the message ID is missing (the template rendered empty) the newest message of the ticket is
 * read instead.
 */
const fetchMessage = async (context, body) => {

    const ticketId = lib.webhookId(body.ticket_id);
    if (!ticketId) {
        return null;
    }
    const messageId = lib.webhookId(body.message_id);
    if (messageId) {
        return lib.getTicketMessage(context, ticketId, messageId);
    }
    const [latest] = await lib.listLatestMessages(context, { ticketId, limit: 1 });
    return latest || null;
};

// Webhook trigger on a Gorgias HTTP integration (trigger "ticket_message_created"). The output is
// the ticket message as the API returns it.
module.exports = {

    fetchMessage,

    async start(context) {

        const integrationId = await lib.registerWebhook(context, EVENT);
        return context.saveState({ integrationId });
    },

    async stop(context) {

        const { integrationId } = await context.loadState() || {};
        return lib.unregisterWebhook(context, integrationId);
    },

    async receive(context) {

        if (context.messages.webhook) {
            const body = lib.webhookBody(context);
            const message = await fetchMessage(context, body);
            if (!message) {
                await context.log({ step: 'Ignored a webhook call without a ticket or message.', body });
                return context.response();
            }

            // Gorgias may deliver an event more than once.
            if (await lib.onceByKey(context, `message-${message.id}`)) {
                await context.sendJson(message, 'out');
            }
            return context.response();
        }
    },

    // Flow Test Mode: the newest message of the account.
    async test(context) {

        const [message] = await lib.listLatestMessages(context, { limit: 1 });
        if (!message) {
            throw new context.CancelError('There is no ticket message in this Gorgias account yet. Add one and test again.');
        }
        return context.sendJson(message, 'out');
    }
};
