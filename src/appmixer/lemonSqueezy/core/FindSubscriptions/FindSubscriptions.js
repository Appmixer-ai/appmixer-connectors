
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'attributes':{ 'type':'object','properties':{ 'status':{ 'type':'string','title':'Attributes.Status' },'billing_interval':{ 'type':'string','title':'Attributes.Billing Interval' } },'title':'Attributes' } };

module.exports = {
    async receive(context) {

        const { store_id, customer_id, order_id, product_id, variant_id, status, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // Build query parameters
        const params = {};
        if (store_id) {
            params['filter[store_id]'] = store_id;
        }
        if (customer_id) {
            params['filter[customer_id]'] = customer_id;
        }
        if (order_id) {
            params['filter[order_id]'] = order_id;
        }
        if (product_id) {
            params['filter[product_id]'] = product_id;
        }
        if (variant_id) {
            params['filter[variant_id]'] = variant_id;
        }
        if (status) {
            params['filter[status]'] = status;
        }

        // https://docs.lemonsqueezy.com/api/subscriptions
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.lemonsqueezy.com/v1/subscriptions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            params
        });

        const records = data.data || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
