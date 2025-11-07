'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { paymentLinkId } = context.messages.in.content;

        if (!paymentLinkId) {
            throw new context.CancelError('Payment Link Id is required!');
        }

        // https://docs.mollie.com/reference/v2/payment-links-api/get-payment-link
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/payment-links/${paymentLinkId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
