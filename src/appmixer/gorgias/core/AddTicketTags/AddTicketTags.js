'use strict';

const lib = require('../../lib');

// POST /api/tickets/{ticket_id}/tags - https://developers.gorgias.com/reference/create-ticket-tags
// Adds tags by name; tags already on the ticket stay.
module.exports = {

    async receive(context) {

        const { ticketId, tags } = context.messages.in.content;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }
        if (!tags || (Array.isArray(tags) && !tags.length)) {
            throw new context.CancelError('Tags is required!');
        }
        const id = lib.requireId(context, ticketId, 'Ticket ID');
        const names = lib.normalizeMultiselectInput(tags, context, 'Tags');
        if (!names.length) {
            throw new context.CancelError('Tags is required!');
        }

        await lib.request(context, { method: 'POST', path: `/tickets/${id}/tags`, data: { names } });
        return context.sendJson({ ticketId: id, tags: names }, 'out');
    }
};
