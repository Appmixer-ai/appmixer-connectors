'use strict';

const lib = require('../../lib');

// PUT /api/customers/{id} - https://developers.gorgias.com/reference/update-customer
// Only the fields the user filled in are sent.
module.exports = {

    async receive(context) {

        const { customerId, email, name, externalId, language, timezone } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }
        const id = lib.requireId(context, customerId, 'Customer ID');

        const body = lib.compact({ email, name, external_id: externalId, language, timezone });
        if (!Object.keys(body).length) {
            throw new context.CancelError('Fill in at least one field to update.');
        }

        await lib.request(context, { method: 'PUT', path: `/customers/${id}`, data: body });
        return context.sendJson({}, 'out');
    }
};
