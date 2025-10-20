
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'first_name':{ 'type':'string','title':'First Name' },'last_name':{ 'type':'string','title':'Last Name' },'email':{ 'type':'string','title':'Email' },'is_active':{ 'type':'boolean','title':'Is Active' },'is_admin':{ 'type':'boolean','title':'Is Admin' },'timezone':{ 'type':'string','title':'Timezone' } };

module.exports = {
    async receive(context) {

        const { is_active, updated_since, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Users' });
        }

        // https://help.getharvest.com/api-v2/users-api/users/users/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/users',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
