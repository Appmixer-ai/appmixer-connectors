
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'spent_date':{ 'type':'string','title':'Spent Date' },'user':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'User.Id' },'name':{ 'type':'string','title':'User.Name' } },'title':'User' },'client':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'Client.Id' },'name':{ 'type':'string','title':'Client.Name' } },'title':'Client' },'project':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'Project.Id' },'name':{ 'type':'string','title':'Project.Name' } },'title':'Project' },'task':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'Task.Id' },'name':{ 'type':'string','title':'Task.Name' } },'title':'Task' },'hours':{ 'type':'number','title':'Hours' },'notes':{ 'type':'string','title':'Notes' },'is_locked':{ 'type':'boolean','title':'Is Locked' },'is_billed':{ 'type':'boolean','title':'Is Billed' },'is_running':{ 'type':'boolean','title':'Is Running' },'timer_started_at':{ 'type':'null','title':'Timer Started At' },'created_at':{ 'type':'string','title':'Created At' },'updated_at':{ 'type':'string','title':'Updated At' } };

module.exports = {
    async receive(context) {

        const { user_id, client_id, project_id, task_id, is_billed, is_running, updated_since, from, to, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Time_entries' });
        }

        // https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/time_entries',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
