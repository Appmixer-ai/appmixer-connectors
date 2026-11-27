'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            companyId,
            userId,
            stageId,
            description,
            date,
            productId,
            quantity,
            price,
            orderRows,
            contactId,
            notes,
            customFields
        } = context.messages.in.content;

        if (!companyId) {
            throw new context.CancelError('Company ID is required!');
        }
        if (!userId) {
            throw new context.CancelError('User is required!');
        }
        if (!stageId) {
            throw new context.CancelError('Stage is required!');
        }
        if (!description) {
            throw new context.CancelError('Description is required!');
        }
        if (!date) {
            throw new context.CancelError('Date is required!');
        }

        const rows = lib.orderRows(context, { orderRows, productId, quantity, price });
        // An order is an /orders record with probability 100.
        const chance = 100;

        const body = lib.compact({
            description,
            date: lib.toDate(context, date, 'Date'),
            user: lib.ref(userId),
            client: lib.ref(companyId),
            contact: lib.ref(contactId),
            stage: lib.ref(stageId),
            probability: chance,
            notes,
            orderRow: rows,
            custom: lib.parseCustomFields(context, customFields)
        });

        // https://api.upsales.com/ - Order: POST /orders
        const { data } = await lib.request(context, { method: 'POST', path: '/orders', data: body });
        return context.sendJson(data.data, 'out');
    }
};
