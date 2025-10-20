
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'name':{ 'type':'string','title':'Name' },'is_active':{ 'type':'boolean','title':'Is Active' },'address':{ 'type':'string','title':'Address' },'created_at':{ 'type':'string','title':'Created At' },'updated_at':{ 'type':'string','title':'Updated At' } };

module.exports = {
    async receive(context) {

        const { is_active, updated_since, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Clients' });
        }

        // https://help.getharvest.com/api-v2/clients-api/clients/clients/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/clients',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
