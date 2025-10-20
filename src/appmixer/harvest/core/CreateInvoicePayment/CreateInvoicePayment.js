
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { invoice_id, amount, paid_at, notes } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/invoices-api/invoices/payments/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/invoices/{invoice_id}/payments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
