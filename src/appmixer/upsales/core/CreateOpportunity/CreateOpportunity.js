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
            probability,
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
        let chance = probability;
        if (chance === undefined || chance === null || chance === '') {
            // Probability is mandatory for /orders; without one the stage's probability is used.
            const { data: stage } = await lib.request(context, { path: '/orderstages/' + encodeURIComponent(stageId) });
            chance = stage.data?.probability;
        }
        chance = Number(chance);
        if (!Number.isFinite(chance) || chance < 1 || chance > 99) {
            throw new context.CancelError('An opportunity needs a probability between 1 and 99. Choose an opportunity stage or set Probability.');
        }

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

        // https://api.upsales.com/ - Opportunity: POST /orders
        const { data } = await lib.request(context, { method: 'POST', path: '/orders', data: body });
        return context.sendJson(data.data, 'out');
    }
};
