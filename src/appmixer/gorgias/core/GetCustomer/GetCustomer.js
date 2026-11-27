'use strict';

const lib = require('../../lib');

// GET /api/customers/{id} - https://developers.gorgias.com/reference/get-customer
module.exports = {

    async receive(context) {

        const { customerId } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }
        const id = lib.requireId(context, customerId, 'Customer ID');

        const { data } = await lib.request(context, { method: 'GET', path: `/customers/${id}` });
        return context.sendJson(data, 'out');
    }
};
