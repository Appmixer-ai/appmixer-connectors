
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'attributes':{ 'type':'object','properties':{ 'status':{ 'type':'string','title':'Attributes.Status' },'billing_interval':{ 'type':'string','title':'Attributes.Billing Interval' } },'title':'Attributes' } };

module.exports = {
    async receive(context) {

        const { store_id, customer_id, order_id, product_id, variant_id, status, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // https://docs.lemonsqueezy.com/api/subscriptions
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/subscriptions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
