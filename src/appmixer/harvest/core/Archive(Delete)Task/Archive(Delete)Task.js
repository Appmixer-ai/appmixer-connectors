
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { task_id } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/tasks-api/tasks/tasks/
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: '/tasks/{task_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
