
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { project_id, name, is_active, bill_by, hourly_rate, budget, budget_is_monthly, notes } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/projects-api/projects/projects/
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: '/projects/{project_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
