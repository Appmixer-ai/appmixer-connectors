
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { expense_id, project_id, expense_category_id, spent_date, total_cost, units, is_billable, notes } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/expenses-api/expenses/expenses/
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: '/expenses/{expense_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
