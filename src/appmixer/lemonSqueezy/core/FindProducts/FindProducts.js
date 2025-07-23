
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'attributes':{ 'type':'object','properties':{ 'name':{ 'type':'string','title':'Attributes.Name' },'price':{ 'type':'string','title':'Attributes.Price' } },'title':'Attributes' } };

module.exports = {

    async receive(context) {

        const { storeId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // Build URL with optional store_id filter
        let url = 'https://api.lemonsqueezy.com/v1/products';
        if (storeId) {
            url += `?filter[store_id]=${storeId}`;
        }

        // https://docs.lemonsqueezy.com/api/products
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            }
        });

        const records = data.data || [];

        // Send to notFound port if no products are found
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
