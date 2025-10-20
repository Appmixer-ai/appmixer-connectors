
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'name':{ 'type':'string','title':'Name' },'unit_name':{ 'type':'null','title':'Unit Name' },'unit_price':{ 'type':'null','title':'Unit Price' },'is_active':{ 'type':'boolean','title':'Is Active' } };

module.exports = {
    async receive(context) {

        const { is_active, updated_since, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Expense_categories' });
        }

        // https://help.getharvest.com/api-v2/expenses-api/expenses/expense-categories/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/expense_categories',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
