
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'name':{ 'type':'string','title':'Name' },'active_count':{ 'type':'integer','title':'Active Count' },'sent_count':{ 'type':'integer','title':'Sent Count' },'created_at':{ 'type':'string','title':'Created At' } };

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Groups' });
        }

        // https://developers.mailerlite.com/docs/#groups
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://connect.mailerlite.com/api/groups',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        const records = data.data || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
