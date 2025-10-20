
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'name':{ 'type':'string','title':'Name' },'is_active':{ 'type':'boolean','title':'Is Active' },'billable_by_default':{ 'type':'boolean','title':'Billable By Default' },'default_hourly_rate':{ 'type':'number','title':'Default Hourly Rate' },'is_default':{ 'type':'boolean','title':'Is Default' },'created_at':{ 'type':'string','title':'Created At' },'updated_at':{ 'type':'string','title':'Updated At' } };

module.exports = {
    async receive(context) {

        const { is_active, updated_since, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tasks' });
        }

        // https://help.getharvest.com/api-v2/tasks-api/tasks/tasks/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/tasks',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
