
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { invoice_id } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/invoices-api/invoices/invoices/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/invoices/{invoice_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
