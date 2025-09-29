
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'name':{ 'type':'string','title':'Name' },'slug':{ 'type':'string','title':'Slug' },'createdAt':{ 'type':'string','title':'Created At' },'updatedAt':{ 'type':'string','title':'Updated At' },'email':{ 'type':'string','title':'Email' },'status':{ 'type':'string','title':'Status' } };

module.exports = {
    async receive(context) {

        const { page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Mailboxes' });
        }

        // Build query parameters
        const params = {};
        if (page) params.page = page;

        // https://developer.helpscout.com/mailbox-api/endpoints/mailboxes/list/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/mailboxes',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const records = data['_embedded']?.mailboxes || [];
        return await lib.sendArrayOutput({ context, records, outputType });
    }
};
