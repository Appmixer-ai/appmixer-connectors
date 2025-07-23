
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'attributes':{ 'type':'object','properties':{ 'status':{ 'type':'string','title':'Attributes.Status' },'total':{ 'type':'string','title':'Attributes.Total' } },'title':'Attributes' } };

module.exports = {

    async receive(context) {

        const { store_id, customer_id, user_email, outputType } = context.messages.in.content;

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
        if (user_email) {
            params['filter[user_email]'] = user_email;
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
