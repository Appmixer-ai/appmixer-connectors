'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            ticketId,
            title,
            statusId,
            typeId,
            userId,
            companyId,
            contactId,
            priority,
            customFields
        } = context.messages.in.content;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }

        const body = lib.compact({
            title,
            status: lib.ref(statusId),
            type: lib.ref(typeId),
            user: lib.ref(userId),
            client: lib.ref(companyId),
            contact: lib.ref(contactId),
            priority: priority === undefined || priority === null || priority === '' ? undefined : Number(priority),
            custom: lib.parseCustomFields(context, customFields)
        });

        // https://api.upsales.com/ - Support tickets: PUT /tickets/{id}
        await lib.request(context, { method: 'PUT', path: '/tickets/' + encodeURIComponent(ticketId), data: body });
        return context.sendJson({}, 'out');
    }
};
