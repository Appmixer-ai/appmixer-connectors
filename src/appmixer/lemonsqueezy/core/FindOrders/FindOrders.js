
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'attributes':{ 'type':'object','properties':{ 'status':{ 'type':'string','title':'Attributes.Status' },'total':{ 'type':'string','title':'Attributes.Total' } },'title':'Attributes' } };

module.exports = {

    async receive(context) {

        const { storeId, customerId, userEmail, outputType } = context.messages.in.content;

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
        if (userEmail) {
            params['filter[user_email]'] = userEmail;
        }

        // https://docs.lemonsqueezy.com/api/orders
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.lemonsqueezy.com/v1/orders',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            params
        });

        const records = data.data || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
