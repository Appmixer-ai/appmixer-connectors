'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const content = context.messages.in.content;
        const id = lib.requireId(context, content.ticketId, 'Ticket ID');

        const body = lib.ticketFields(context, content);
        if (!Object.keys(body).length) {
            throw new context.CancelError('Fill in at least one field to update.');
        }

        await lib.request(context, { method: 'PUT', path: `/tickets/${id}`, data: body });

        return context.sendJson({}, 'out');
    }
};
