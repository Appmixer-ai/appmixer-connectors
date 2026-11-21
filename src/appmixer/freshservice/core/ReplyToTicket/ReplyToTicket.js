'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { ticketId, body, fromEmail, ccEmails, bccEmails } = context.messages.in.content;
        const id = lib.requireId(context, ticketId, 'Ticket ID');
        if (!body) {
            throw new context.CancelError('Body is required!');
        }

        const { data } = await lib.request(context, {
            method: 'POST',
            path: `/tickets/${id}/reply`,
            data: lib.compact({
                body,
                from_email: fromEmail,
                cc_emails: lib.splitList(ccEmails),
                bcc_emails: lib.splitList(bccEmails)
            })
        });

        return context.sendJson(lib.withoutNulls(data.conversation), 'out');
    }
};
