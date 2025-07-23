
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'attributes':{ 'type':'object','properties':{ 'name':{ 'type':'string','title':'Attributes.Name' },'price':{ 'type':'string','title':'Attributes.Price' } },'title':'Attributes' } };

module.exports = {
    async receive(context) {

        const { store_id, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // https://docs.lemonsqueezy.com/api/products
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/products',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
