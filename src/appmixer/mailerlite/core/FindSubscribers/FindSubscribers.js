
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Subscriber Id' },'email':{ 'type':'string','title':'Email' },'status':{ 'type':'string','title':'Status' },'created_at':{ 'type':'string','title':'Created At' },'updated_at':{ 'type':'string','title':'Updated At' } };

module.exports = {
    async receive(context) {

        const { outputType, status, limit } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Subscribers' });
        }

        const params = {};
        if (status) {
            params['filter[status]'] = status;
        }
        params.limit = Math.min(limit || 100, 100);

        // https://developers.mailerlite.com/docs/subscribers.html#list-all-subscribers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://connect.mailerlite.com/api/subscribers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params: params
        });

        const records = data.data || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
