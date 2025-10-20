
'use strict';

const lib = require('../../lib');
module.exports = {
    async receive(context) {

        const { invoice_id, purchase_order, issue_date, due_date, currency, discount, tax, tax2, subject, notes, state, line_items } = context.messages.in.content;


        // https://help.getharvest.com/api-v2/invoices-api/invoices/invoices/
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: '/invoices/{invoice_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });


        return context.sendJson(data, 'out');
    }
};
