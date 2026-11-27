'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { ticketId } = context.messages.in.content;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }

        // https://api.upsales.com/ - Support tickets: DELETE /tickets/{id} (also deletes its comments)
        await lib.request(context, { method: 'DELETE', path: '/tickets/' + encodeURIComponent(ticketId) });
        return context.sendJson({}, 'out');
    }
};
