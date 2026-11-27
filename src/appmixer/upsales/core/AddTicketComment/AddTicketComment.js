'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { ticketId, description, isPublic, userId } = context.messages.in.content;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }
        if (!description) {
            throw new context.CancelError('Text is required!');
        }
        if (!userId) {
            throw new context.CancelError('Author is required!');
        }

        const body = lib.compact({
            description,
            isPublic: isPublic === true || isPublic === 'true',
            user: lib.ref(userId)
        });

        // https://api.upsales.com/ - Support tickets: POST /tickets/{id}/comment. Only this
        // endpoint runs the reply and notification handling (not a PUT of the comments array).
        const { data } = await lib.request(context, {
            method: 'POST',
            path: '/tickets/' + encodeURIComponent(ticketId) + '/comment',
            data: body
        });
        return context.sendJson(data.data, 'out');
    }
};
