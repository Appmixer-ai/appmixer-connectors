
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { project_id, task_id, is_active, billable, hourly_rate, budget } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/projects-api/projects/task-assignments/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/projects/{project_id}/task_assignments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
