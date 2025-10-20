
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { client_id, name, is_active, bill_by, hourly_rate, budget, budget_is_monthly, notes } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/projects-api/projects/projects/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/projects',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
