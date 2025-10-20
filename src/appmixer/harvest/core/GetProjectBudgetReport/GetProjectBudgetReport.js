
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { project_id } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/reports-api/reports/project-budget/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/reports/project_budget',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
