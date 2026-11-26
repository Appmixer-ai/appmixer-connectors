'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            orderId,
            stageId,
            probability,
            description,
            date,
            userId,
            contactId,
            notes,
            orderRows,
            customFields
        } = context.messages.in.content;

        if (!orderId) {
            throw new context.CancelError('Order ID is required!');
        }

        const body = lib.compact({
            stage: lib.ref(stageId),
            probability: probability === undefined || probability === null || probability === '' ? undefined : Number(probability),
            description,
            date: lib.toDate(context, date, 'Date'),
            user: lib.ref(userId),
            contact: lib.ref(contactId),
            notes,
            orderRow: orderRows ? lib.orderRows(context, { orderRows }) : undefined,
            custom: lib.parseCustomFields(context, customFields)
        });

        // https://api.upsales.com/ - Opportunity / Order: PUT /orders/{id}
        await lib.request(context, { method: 'PUT', path: '/orders/' + encodeURIComponent(orderId), data: body });
        return context.sendJson({}, 'out');
    }
};
