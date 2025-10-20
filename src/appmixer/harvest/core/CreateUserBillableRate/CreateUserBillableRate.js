
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { user_id, amount, start_date } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/users-api/users/billable-rates/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/users/{user_id}/billable_rates',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
