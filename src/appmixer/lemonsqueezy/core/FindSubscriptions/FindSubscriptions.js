
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'attributes':{ 'type':'object','properties':{ 'status':{ 'type':'string','title':'Attributes.Status' },'billing_interval':{ 'type':'string','title':'Attributes.Billing Interval' } },'title':'Attributes' } };

module.exports = {
    async receive(context) {
        const {
            storeId, customerId, orderId, productId, variantId, status, outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // Build query parameters
        const params = {};
        if (storeId) {
            params['filter[store_id]'] = storeId;
        }
        if (customerId) {
            params['filter[customer_id]'] = customerId;
        }
        if (orderId) {
            params['filter[order_id]'] = orderId;
        }
        if (productId) {
            params['filter[product_id]'] = productId;
        }
        if (variantId) {
            params['filter[variant_id]'] = variantId;
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

        // Send to notFound port if no subscriptions are found
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
