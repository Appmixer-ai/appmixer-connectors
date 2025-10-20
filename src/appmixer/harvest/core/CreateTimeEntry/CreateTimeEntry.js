
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { user_id, project_id, task_id, spent_date, hours, notes, external_reference, started_time, ended_time } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/time_entries',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
