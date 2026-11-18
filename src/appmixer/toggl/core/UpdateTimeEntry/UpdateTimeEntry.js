'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            timeEntryId,
            description,
            start,
            stop,
            projectId,
            taskId,
            billable
        } = context.messages.in.content;

        const id = lib.requireId(context, timeEntryId, 'Time Entry ID');
        const { workspace } = await lib.urls(context);
        const url = `${workspace}/time-entries/${id}`;

        // Only the fields that change are sent.
        const body = {};
        if (description) body.description = description;
        const startTime = lib.toTogglTime(context, start, 'Start');
        if (startTime) body.start = startTime;
        const stopTime = lib.toTogglTime(context, stop, 'Stop');
        if (stopTime) {
            // Toggl stores start and duration, so a new Stop is a new duration.
            let from = startTime;
            if (!from) {
                const { data } = await lib.request(context, { method: 'GET', url });
                from = data && data.start;
            }
            if (!from) {
                throw new context.CancelError('Stop cannot be set: the time entry has no Start.');
            }
            const seconds = Math.round((new Date(stopTime) - new Date(from)) / 1000);
            if (seconds < 0) {
                throw new context.CancelError('Stop must be after Start.');
            }
            body.duration = seconds;
        }
        const project = lib.optionalId(context, projectId, 'Project');
        if (project) body.project_id = project;
        const task = lib.optionalId(context, taskId, 'Task ID');
        if (task) body.task_id = task;
        if (billable === true || billable === 'true') body.billable = true;
        if (billable === false || billable === 'false') body.billable = false;

        if (Object.keys(body).length === 0) {
            throw new context.CancelError('Fill in at least one field to update.');
        }

        await lib.request(context, { method: 'PATCH', url, data: body });

        return context.sendJson({}, 'out');
    }
};
