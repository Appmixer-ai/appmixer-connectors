
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'task':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'Task.Id' },'name':{ 'type':'string','title':'Task.Name' } },'title':'Task' },'is_active':{ 'type':'boolean','title':'Is Active' },'billable':{ 'type':'boolean','title':'Billable' },'hourly_rate':{ 'type':'number','title':'Hourly Rate' },'budget':{ 'type':'null','title':'Budget' },'created_at':{ 'type':'string','title':'Created At' },'updated_at':{ 'type':'string','title':'Updated At' } };

module.exports = {
    async receive(context) {

        const { project_id, is_active, updated_since, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Task_assignments' });
        }

        // https://help.getharvest.com/api-v2/projects-api/projects/task-assignments/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/projects/{project_id}/task_assignments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
