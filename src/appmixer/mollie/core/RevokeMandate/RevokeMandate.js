'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { customerId, mandateId, testmode } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer Id is required!');
        }

        if (!mandateId) {
            throw new context.CancelError('Mandate Id is required!');
        }

        const params = {};
        if (testmode) {
            params.testmode = true;
        }

        // https://docs.mollie.com/reference/v2/mandates-api/revoke-mandate
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.mollie.com/v2/customers/${customerId}/mandates/${mandateId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params
        });

        return context.sendJson({}, 'out');
    }
};
