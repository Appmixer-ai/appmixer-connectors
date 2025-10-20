
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { project_id, user_id, is_active, is_project_manager, hourly_rate, budget } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/projects-api/projects/user-assignments/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/projects/{project_id}/user_assignments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
