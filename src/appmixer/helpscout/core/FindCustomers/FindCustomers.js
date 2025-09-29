
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'firstName':{ 'type':'string','title':'First Name' },'lastName':{ 'type':'string','title':'Last Name' },'photoUrl':{ 'type':'null','title':'Photo Url' },'emails':{ 'type':'array','items':{ 'type':'object','properties':{ 'value':{ 'type':'string','title':'Emails.Value' },'type':{ 'type':'string','title':'Emails.Type' } } },'title':'Emails' },'createdAt':{ 'type':'string','title':'Created At' },'updatedAt':{ 'type':'string','title':'Updated At' } };

module.exports = {
    async receive(context) {

        const { email, query, modifiedSince, page, pageSize, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Customers', value: 'customers' });
        }

        // Build query parameters
        const params = {};
        if (email) params.email = email;
        if (query) params.query = query;
        if (modifiedSince) params.modifiedSince = modifiedSince;
        if (page) params.page = page;
        if (pageSize) params.pageSize = pageSize;

        // https://developer.helpscout.com/mailbox-api/endpoints/customers/list/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const records = data['_embedded']?.customers || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
