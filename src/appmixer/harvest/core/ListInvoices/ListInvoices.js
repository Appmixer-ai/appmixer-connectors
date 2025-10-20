
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'client':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'Client.Id' },'name':{ 'type':'string','title':'Client.Name' } },'title':'Client' },'number':{ 'type':'string','title':'Number' },'amount':{ 'type':'number','title':'Amount' },'currency':{ 'type':'string','title':'Currency' },'state':{ 'type':'string','title':'State' },'issue_date':{ 'type':'string','title':'Issue Date' },'due_date':{ 'type':'string','title':'Due Date' },'created_at':{ 'type':'string','title':'Created At' } };

module.exports = {
    async receive(context) {

        const { client_id, project_id, updated_since, from, to, state, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Invoices' });
        }

        // https://help.getharvest.com/api-v2/invoices-api/invoices/invoices/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/invoices',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
