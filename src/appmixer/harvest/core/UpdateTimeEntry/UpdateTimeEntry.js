
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { time_entry_id, hours, notes, spent_date, project_id, task_id } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: '/time_entries/{time_entry_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
