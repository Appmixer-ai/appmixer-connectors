'use strict';

const lib = require('../../lib');

// POST /api/tickets - https://developers.gorgias.com/reference/create-ticket
// A ticket needs at least one message. The first message is an incoming message of the customer
// on the API channel: channel "api", via "api", from_agent false, sender = the customer
// (https://developers.gorgias.com/docs/create-a-ticket-using-api).
module.exports = {

    async receive(context) {

        const {
            customerEmail,
            customerName,
            subject,
            message,
            messageHtml,
            status,
            priority,
            assigneeUserId,
            tags,
            externalId
        } = context.messages.in.content;

        if (!customerEmail) {
            throw new context.CancelError('Customer Email is required!');
        }
        if (!subject) {
            throw new context.CancelError('Subject is required!');
        }
        if (!message) {
            throw new context.CancelError('Message is required!');
        }

        const customer = lib.compact({ email: customerEmail, name: customerName });
        const firstMessage = lib.compact({
            channel: 'api',
            via: 'api',
            from_agent: false,
            sender: customer,
            subject,
            body_text: message,
            body_html: messageHtml,
            // Gorgias rules match keywords against stripped_text only.
            stripped_text: message
        });

        const body = lib.compact({
            channel: 'api',
            via: 'api',
            from_agent: false,
            customer,
            subject,
            status,
            priority,
            external_id: externalId,
            messages: [firstMessage]
        });

        const assignee = lib.optionalId(context, assigneeUserId, 'Assignee');
        if (assignee) {
            body.assignee_user = { id: assignee };
        }
        if (tags) {
            const names = lib.normalizeMultiselectInput(tags, context, 'Tags');
            if (names.length) {
                body.tags = names.map(name => ({ name }));
            }
        }

        const { data } = await lib.request(context, { method: 'POST', path: '/tickets', data: body });
        return context.sendJson(data, 'out');
    }
};
