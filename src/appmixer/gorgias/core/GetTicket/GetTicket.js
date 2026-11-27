'use strict';

const lib = require('../../lib');

// GET /api/tickets/{id} - https://developers.gorgias.com/reference/get-ticket
module.exports = {

    async receive(context) {

        const { ticketId } = context.messages.in.content;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }

        const ticket = await lib.getTicket(context, lib.requireId(context, ticketId, 'Ticket ID'));
        return context.sendJson(ticket, 'out');
    }
};
