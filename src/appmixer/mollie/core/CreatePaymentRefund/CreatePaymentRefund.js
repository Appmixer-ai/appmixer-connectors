'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { paymentId, amount, description, metadata, testmode } = context.messages.in.content;

        if (!paymentId) {
            throw new context.CancelError('Payment ID is required!');
        }

        const data = {};

        if (amount) {
            data.amount = amount;
        }

        if (description) {
            data.description = description;
        }

        if (metadata) {
            data.metadata = metadata;
        }

        if (testmode !== undefined) {
            data.testmode = testmode;
        }

        // https://docs.mollie.com/reference/v2/refunds-api/create-payment-refund
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.mollie.com/v2/payments/${paymentId}/refunds`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data
        });

        return context.sendJson(response.data, 'out');
    }
};
