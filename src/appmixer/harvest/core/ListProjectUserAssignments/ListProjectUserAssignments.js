
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'user':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'User.Id' },'name':{ 'type':'string','title':'User.Name' } },'title':'User' },'is_active':{ 'type':'boolean','title':'Is Active' },'is_project_manager':{ 'type':'boolean','title':'Is Project Manager' },'created_at':{ 'type':'string','title':'Created At' },'updated_at':{ 'type':'string','title':'Updated At' } };

module.exports = {
    async receive(context) {

        const { project_id, is_active, updated_since, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'User_assignments' });
        }

        // https://help.getharvest.com/api-v2/projects-api/projects/user-assignments/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/projects/{project_id}/user_assignments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
