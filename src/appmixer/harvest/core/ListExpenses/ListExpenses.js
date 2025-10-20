
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'spent_date':{ 'type':'string','title':'Spent Date' },'user':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'User.Id' },'name':{ 'type':'string','title':'User.Name' } },'title':'User' },'project':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'Project.Id' },'name':{ 'type':'string','title':'Project.Name' } },'title':'Project' },'category':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'Category.Id' },'name':{ 'type':'string','title':'Category.Name' } },'title':'Category' },'total_cost':{ 'type':'number','title':'Total Cost' },'is_billable':{ 'type':'boolean','title':'Is Billable' },'is_invoiced':{ 'type':'boolean','title':'Is Invoiced' },'notes':{ 'type':'string','title':'Notes' } };

module.exports = {
    async receive(context) {

        const { user_id, client_id, project_id, updated_since, from, to, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Expenses' });
        }

        // https://help.getharvest.com/api-v2/expenses-api/expenses/expenses/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/expenses',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
