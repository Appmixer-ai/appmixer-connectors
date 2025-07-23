
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'attributes':{ 'type':'object','properties':{ 'email':{ 'type':'string','title':'Attributes.Email' },'name':{ 'type':'string','title':'Attributes.Name' } },'title':'Attributes' } };

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // Build query parameters
        const params = {};
        if (query) {
            params['filter[email]'] = query;
        }

        // https://docs.lemonsqueezy.com/api/customers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.lemonsqueezy.com/v1/customers',
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
