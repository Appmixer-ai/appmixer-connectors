
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { expense_id } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/expenses-api/expenses/expenses/
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: '/expenses/{expense_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
