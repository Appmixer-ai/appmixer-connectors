'use strict';

const lib = require('../../lib');

// PUT /api/tickets/{id} - https://developers.gorgias.com/reference/update-ticket
// Only the fields the user filled in are sent.
module.exports = {

    async receive(context) {

        const { ticketId, subject, status, priority, assigneeUserId, externalId } = context.messages.in.content;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }
        const id = lib.requireId(context, ticketId, 'Ticket ID');

        const body = lib.compact({ subject, status, priority, external_id: externalId });
        const assignee = lib.optionalId(context, assigneeUserId, 'Assignee');
        if (assignee) {
            body.assignee_user = { id: assignee };
        }
        if (!Object.keys(body).length) {
            throw new context.CancelError('Fill in at least one field to update.');
        }

        await lib.request(context, { method: 'PUT', path: `/tickets/${id}`, data: body });
        return context.sendJson({}, 'out');
    }
};
