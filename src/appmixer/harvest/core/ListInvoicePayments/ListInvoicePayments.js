
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'amount':{ 'type':'number','title':'Amount' },'paid_at':{ 'type':'string','title':'Paid At' },'notes':{ 'type':'string','title':'Notes' } };

module.exports = {
    async receive(context) {

        const { invoice_id, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Payments' });
        }

        // https://help.getharvest.com/api-v2/invoices-api/invoices/payments/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/invoices/{invoice_id}/payments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
