'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { ticketId, body, notifyEmails } = context.messages.in.content;
        const isPrivate = context.messages.in.content.private;
        const id = lib.requireId(context, ticketId, 'Ticket ID');
        if (!body) {
            throw new context.CancelError('Body is required!');
        }

        const { data } = await lib.request(context, {
            method: 'POST',
            path: `/tickets/${id}/notes`,
            data: lib.compact({
                body,
                // Freshservice makes a note private by default; an unset toggle keeps that.
                private: isPrivate === undefined || isPrivate === null || isPrivate === '' ? true : Boolean(isPrivate),
                notify_emails: lib.splitList(notifyEmails)
            })
        });

        return context.sendJson(lib.withoutNulls(data.conversation), 'out');
    }
};
