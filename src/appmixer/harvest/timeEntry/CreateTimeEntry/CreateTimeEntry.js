'use strict';

module.exports = {

    async receive(context) {

        const {
            projectId,
            taskId,
            spentDate,
            userId,
            hours,
            startedTime,
            endedTime,
            notes
        } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }

        if (!spentDate) {
            throw new context.CancelError('Spent Date is required!');
        }

        const data = {
            project_id: projectId,
            task_id: taskId,
            spent_date: spentDate
        };

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

        // https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/#create-a-time-entry-via-duration
        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.harvestapp.com/v2/time_entries',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.com)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId,
                'Content-Type': 'application/json'
            },
            data
        });

        return context.sendJson(responseData, 'out');
    }
};
