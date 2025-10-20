
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { expense_category_id } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/expenses-api/expenses/expense-categories/
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: '/expense_categories/{expense_category_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
