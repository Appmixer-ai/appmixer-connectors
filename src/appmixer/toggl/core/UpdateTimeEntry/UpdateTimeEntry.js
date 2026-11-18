'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            workspaceId,
            timeEntryId,
            description,
            start,
            stop,
            projectId,
            taskId,
            billable
        } = context.messages.in.content;

        const id = lib.requireId(context, timeEntryId, 'Time Entry ID');
        const resolvedWorkspaceId = await lib.resolveWorkspaceId(context, workspaceId);

        // Toggl asks to send only the fields that change.
        const body = {};
        if (description) body.description = description;
        const startTime = lib.toTogglTime(context, start, 'Start');
        if (startTime) body.start = startTime;
        const stopTime = lib.toTogglTime(context, stop, 'Stop');
        if (stopTime) body.stop = stopTime;
        const project = lib.optionalId(context, projectId, 'Project');
        if (project) body.project_id = project;
        const task = lib.optionalId(context, taskId, 'Task ID');
        if (task) body.task_id = task;
        if (billable === true || billable === 'true') body.billable = true;
        if (billable === false || billable === 'false') body.billable = false;

        if (Object.keys(body).length === 0) {
            throw new context.CancelError('Fill in at least one field to update.');
        }

        await lib.request(context, {
            method: 'PUT',
            url: `${lib.API_BASE_URL}/workspaces/${resolvedWorkspaceId}/time_entries/${id}`,
            data: body
        });

        return context.sendJson({}, 'out');
    }
};
