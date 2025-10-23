'use strict';

module.exports = {

    async receive(context) {

        const {
            timeEntryId,
            projectId,
            taskId,
            spentDate,
            userId,
            hours,
            startedTime,
            endedTime,
            notes
        } = context.messages.in.content;

        if (!timeEntryId) {
            throw new context.CancelError('Time Entry ID is required!');
        }

        const data = {};

        if (projectId !== undefined && projectId !== null) {
            data.project_id = projectId;
        }

        if (taskId !== undefined && taskId !== null) {
            data.task_id = taskId;
        }

        if (spentDate) {
            data.spent_date = spentDate;
        }

        if (userId !== undefined && userId !== null) {
            data.user_id = userId;
        }

        if (hours !== undefined && hours !== null) {
            data.hours = hours;
        }

        if (startedTime) {
            data.started_time = startedTime;
        }

        if (endedTime) {
            data.ended_time = endedTime;
        }

        if (notes) {
            data.notes = notes;
        }

        if (Object.keys(data).length === 0) {
            throw new context.CancelError('At least one field to update is required!');
        }

        // https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/#update-a-time-entry
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.harvestapp.com/v2/time_entries/${timeEntryId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.com)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId,
                'Content-Type': 'application/json'
            },
            data
        });

        return context.sendJson({}, 'out');
    }
};
