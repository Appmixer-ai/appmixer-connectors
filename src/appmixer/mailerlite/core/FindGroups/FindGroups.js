
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Group Id' },'name':{ 'type':'string','title':'Group Name' },'active_count':{ 'type':'integer','title':'Active Count' },'sent_count':{ 'type':'integer','title':'Sent Count' },'created_at':{ 'type':'string','title':'Created At' } };

module.exports = {
    async receive(context) {

        const { query, limit, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Groups' });
        }

        const params = {};
        if (query) {
            params['filter[name]'] = query;
        }
        params.limit = Math.min(limit || 100, 100);

        // https://developers.mailerlite.com/docs/groups.html#list-all-groups
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://connect.mailerlite.com/api/groups',
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
