
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'name':{ 'type':'string','title':'Name' },'user_ids':{ 'type':'array','items':{ 'type':'number' },'title':'User Ids' } };

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Roles' });
        }

        // https://help.getharvest.com/api-v2/roles-api/roles/roles/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/roles',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
