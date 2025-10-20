
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { name, is_active, billable_by_default, default_hourly_rate, is_default } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/tasks-api/tasks/tasks/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/tasks',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
