'use strict';

module.exports = {

    async receive(context) {
        const {
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

        if (!type) {
            throw new context.CancelError('Creation type is required!');
        }

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }

        // Validate required fields based on type
        if (type === 'duration' && !spentDate) {
            throw new context.CancelError('Spent Date is required for duration-based entries!');
        }

        if (type === 'start_end_time') {
            if (!startedTime) {
                throw new context.CancelError('Started Time is required for start/end time entries!');
            }
            if (!endedTime) {
                throw new context.CancelError('Ended Time is required for start/end time entries!');
            }
        }

        const body = {
            project_id: projectId,
            task_id: taskId,
            spent_date: spentDate
        };

        // Add fields based on creation type
        if (type === 'duration') {
            body.hours = hours !== undefined && hours !== null ? hours : 0.0;
        } else if (type === 'start_end_time') {
            body.started_time = startedTime;
            body.ended_time = endedTime;
        }

        // Add optional fields
        if (userId !== undefined && userId !== null && userId !== '') {
            body.user_id = userId;
        }

        if (notes !== undefined && notes !== null && notes !== '') {
            body.notes = notes;
        }

        context.log({ step: 'create time entry request', requestData: body });

        // https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/#create-a-time-entry-via-duration
        // https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/#create-a-time-entry-via-start-and-end-time
        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.harvestapp.com/v2/time_entries',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId
            },
            data: body
        });

        context.log({ step: 'created time entry', responseData });

        return context.sendJson(responseData, 'out');
    }
};
