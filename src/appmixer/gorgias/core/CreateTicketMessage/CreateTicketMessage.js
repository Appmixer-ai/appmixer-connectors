'use strict';

const lib = require('../../lib');

// POST /api/tickets/{ticket_id}/messages - https://developers.gorgias.com/reference/create-ticket-message
// Required fields per message type follow
// https://developers.gorgias.com/docs/create-a-new-message-in-ticket-via-api:
// - internal note: channel "internal-note", from_agent true, sender = an existing user, no receiver
// - incoming (customer) message: from_agent false, sender = the customer, no receiver
// - outgoing email: channel "email", from_agent true, sender = a user, receiver = the customer,
//   source.from.address = one of the account's email integrations. Without sent_datetime Gorgias
//   sends the email.
const buildMessage = (context, input) => {

    const { messageType, message, messageHtml, senderEmail, receiverEmail, fromAddress, subject } = input;
    const userEmail = String(senderEmail || context.auth.username || '').trim();
    const common = { via: 'api', subject, body_text: message, body_html: messageHtml, stripped_text: message };

    if (messageType === 'internal-note') {
        return lib.compact({
            ...common,
            channel: 'internal-note',
            from_agent: true,
            public: false,
            sender: { email: userEmail }
        });
    }

    if (messageType === 'customer-message') {
        if (!senderEmail) {
            throw new context.CancelError('Sender Email (the customer) is required for a Customer Message!');
        }
        return lib.compact({
            ...common,
            channel: 'api',
            from_agent: false,
            sender: { email: senderEmail }
        });
    }

    if (messageType === 'email-reply') {
        if (!receiverEmail) {
            throw new context.CancelError('Customer Email is required for an Email Reply!');
        }
        if (!fromAddress) {
            throw new context.CancelError('From Address (one of your Gorgias email integrations) is required for an Email Reply!');
        }
        return lib.compact({
            ...common,
            channel: 'email',
            from_agent: true,
            sender: { email: userEmail },
            receiver: { email: receiverEmail },
            source: {
                type: 'email',
                from: { address: fromAddress },
                to: [{ address: receiverEmail }]
            }
        });
    }

    throw new context.CancelError(`Unsupported Message Type: ${messageType}`);
};

module.exports = {

    buildMessage,

    async receive(context) {

        const input = context.messages.in.content;
        const { ticketId, messageType, message } = input;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }
        if (!messageType) {
            throw new context.CancelError('Message Type is required!');
        }
        if (!message) {
            throw new context.CancelError('Message is required!');
        }
        const id = lib.requireId(context, ticketId, 'Ticket ID');

        const { data } = await lib.request(context, {
            method: 'POST',
            path: `/tickets/${id}/messages`,
            data: buildMessage(context, input)
        });
        return context.sendJson(data, 'out');
    }
};
