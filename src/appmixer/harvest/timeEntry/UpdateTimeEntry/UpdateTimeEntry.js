'use strict';

module.exports = {

    async receive(context) {

        const {
            timeEntryId,
            type,
            projectId,
            taskId,
            userId,
            spentDate,
            hours,
            startedTime,
            endedTime,
            notes
        } = context.messages.in.content;

        if (!timeEntryId) {
            throw new context.CancelError('Time Entry ID is required!');
        }

        // Validate type-specific requirements if type is provided
        if (type === 'start_end_time') {
            if (startedTime && !endedTime) {
                throw new context.CancelError('Ended Time is required when updating with start/end time mode!');
            }
            if (!startedTime && endedTime) {
                throw new context.CancelError('Started Time is required when updating with start/end time mode!');
            }
        }

        const body = {};

        if (projectId !== undefined && projectId !== null && projectId !== '') {
            body.project_id = projectId;
        }

        if (taskId !== undefined && taskId !== null && taskId !== '') {
            body.task_id = taskId;
        }

        if (spentDate !== undefined && spentDate !== null && spentDate !== '') {
            body.spent_date = spentDate;
        }

        if (userId !== undefined && userId !== null && userId !== '') {
            body.user_id = userId;
        }

        // Handle time-based fields based on type
        if (type === 'duration' || !type) {
            if (hours !== undefined && hours !== null && hours !== '') {
                body.hours = hours;
            }
        } else if (type === 'start_end_time') {
            if (startedTime !== undefined && startedTime !== null && startedTime !== '') {
                body.started_time = startedTime;
            }
            if (endedTime !== undefined && endedTime !== null && endedTime !== '') {
                body.ended_time = endedTime;
            }
        }

        if (notes !== undefined && notes !== null && notes !== '') {
            body.notes = notes;
        }

        // https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/#update-a-time-entry
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.harvestapp.com/v2/time_entries/${timeEntryId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId
            },
            data: body
        });

        return context.sendJson({}, 'out');
    }
};
