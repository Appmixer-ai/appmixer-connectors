'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            workspaceId,
            description,
            start,
            stop,
            duration,
            projectId,
            taskId,
            tags,
            billable
        } = context.messages.in.content;

        if (!start) {
            throw new context.CancelError('Start is required!');
        }

        const resolvedWorkspaceId = await lib.resolveWorkspaceId(context, workspaceId);
        const startTime = lib.toTogglTime(context, start, 'Start');
        const stopTime = lib.toTogglTime(context, stop, 'Stop');

        const body = {
            created_with: lib.CREATED_WITH,
            workspace_id: Number(resolvedWorkspaceId),
            start: startTime
        };

        if (stopTime) {
            const seconds = Math.round((new Date(stopTime) - new Date(startTime)) / 1000);
            if (seconds < 0) {
                throw new context.CancelError('Stop must be after Start.');
            }
            // Toggl requires start, stop and duration to agree when all three are sent.
            body.stop = stopTime;
            body.duration = seconds;
        } else if (duration !== undefined && duration !== null && duration !== '') {
            body.duration = Number(duration);
        } else {
            // A negative duration starts a running timer.
            body.duration = -1;
        }

        if (description) body.description = description;
        const project = lib.optionalId(context, projectId, 'Project');
        if (project) body.project_id = project;
        const task = lib.optionalId(context, taskId, 'Task ID');
        if (task) body.task_id = task;
        const tagNames = lib.splitList(tags);
        if (tagNames.length) body.tags = tagNames;
        if (billable) body.billable = true;

        const { data } = await lib.request(context, {
            method: 'POST',
            url: `${lib.API_BASE_URL}/workspaces/${resolvedWorkspaceId}/time_entries`,
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
