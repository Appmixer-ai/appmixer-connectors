'use strict';

const lib = require('../../lib');

// DELETE /api/customers/{id} - https://developers.gorgias.com/reference/delete-customer
module.exports = {

    async receive(context) {

        const { customerId } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }
        const id = lib.requireId(context, customerId, 'Customer ID');

        await lib.request(context, { method: 'DELETE', path: `/customers/${id}` });
        return context.sendJson({}, 'out');
    }
};
