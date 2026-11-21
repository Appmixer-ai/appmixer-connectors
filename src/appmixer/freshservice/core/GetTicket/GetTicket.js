'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { ticketId } = context.messages.in.content;
        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }
        const id = lib.requireId(context, ticketId, 'Ticket ID');

        const { data } = await lib.request(context, { method: 'GET', path: `/tickets/${id}` });

        return context.sendJson(lib.withoutNulls(data.ticket), 'out');
    }
};
