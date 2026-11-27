'use strict';

const lib = require('../../lib');

// DELETE /api/tickets/{id} - https://developers.gorgias.com/reference/delete-ticket
module.exports = {

    async receive(context) {

        const { ticketId } = context.messages.in.content;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }
        const id = lib.requireId(context, ticketId, 'Ticket ID');

        await lib.request(context, { method: 'DELETE', path: `/tickets/${id}` });
        return context.sendJson({}, 'out');
    }
};
