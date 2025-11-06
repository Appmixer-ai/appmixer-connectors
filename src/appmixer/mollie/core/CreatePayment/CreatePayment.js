
'use strict';

const lib = require('../../lib');
module.exports = {
    async receive(context) {        

        const { amount|currency, amount|value, description, redirectUrl, webhookUrl, method, issuer, locale, sequenceType, customerId, mandateId, metadata, testmode } = context.messages.in.content;


        // https://docs.mollie.com/reference/v2/payments-api/create-payment
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.mollie.com/v2/payments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });
    

return context.sendJson(data, 'out');
    }
};
