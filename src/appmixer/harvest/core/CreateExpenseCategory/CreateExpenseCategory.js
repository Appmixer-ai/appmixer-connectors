
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { name, unit_name, unit_price, is_active } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/expenses-api/expenses/expense-categories/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/expense_categories',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
