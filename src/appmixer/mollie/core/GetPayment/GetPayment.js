
'use strict';

const lib = require('../../lib');
module.exports = {
    async receive(context) {

        const { paymentId, testmode } = context.messages.in.content;

        // https://docs.mollie.com/reference/v2/payments-api/get-payment
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/payments/{paymentId}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
