
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'attributes':{ 'type':'object','properties':{ 'status':{ 'type':'string','title':'Attributes.Status' },'total':{ 'type':'string','title':'Attributes.Total' } },'title':'Attributes' } };

module.exports = {
    async receive(context) {

        const { store_id, customer_id, user_email, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // https://docs.lemonsqueezy.com/api/orders
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/orders',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
