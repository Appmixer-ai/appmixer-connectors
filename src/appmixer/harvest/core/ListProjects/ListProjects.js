
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'name':{ 'type':'string','title':'Name' },'code':{ 'type':'string','title':'Code' },'is_active':{ 'type':'boolean','title':'Is Active' },'client':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'Client.Id' },'name':{ 'type':'string','title':'Client.Name' } },'title':'Client' },'bill_by':{ 'type':'string','title':'Bill By' },'budget':{ 'type':'number','title':'Budget' },'budget_is_monthly':{ 'type':'boolean','title':'Budget Is Monthly' },'hourly_rate':{ 'type':'number','title':'Hourly Rate' },'created_at':{ 'type':'string','title':'Created At' },'updated_at':{ 'type':'string','title':'Updated At' } };

module.exports = {
    async receive(context) {

        const { client_id, is_active, updated_since, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Projects' });
        }

        // https://help.getharvest.com/api-v2/projects-api/projects/projects/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/projects',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
