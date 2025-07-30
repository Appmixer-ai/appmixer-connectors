
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'email':{ 'type':'string','title':'Email' },'status':{ 'type':'string','title':'Status' },'created_at':{ 'type':'string','title':'Created At' },'updated_at':{ 'type':'string','title':'Updated At' } };

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Subscribers' });
        }

        const params = {};
        if (query) {
            params.filter = { email: query };
        }

        // https://developers.mailerlite.com/docs/#subscribers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://connect.mailerlite.com/api/subscribers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params: params
        });

        const records = data.data || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
