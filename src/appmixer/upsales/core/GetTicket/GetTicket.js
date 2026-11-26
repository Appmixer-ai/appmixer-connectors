'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { ticketId } = context.messages.in.content;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }

        // https://api.upsales.com/ - Support tickets: GET /tickets/{id}
        const { data } = await lib.request(context, { path: '/tickets/' + encodeURIComponent(ticketId) });
        return context.sendJson(data.data, 'out');
    }
};
