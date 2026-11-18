'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            description,
            start,
            stop,
            duration,
            projectId,
            taskId,
            tagIds,
            billable
        } = context.messages.in.content;

        const startTime = lib.toTogglTime(context, start, 'Start');
        const stopTime = lib.toTogglTime(context, stop, 'Stop');
        const hasDuration = duration !== undefined && duration !== null && duration !== '';

        const body = { type: 'activity' };
        if (description) body.description = description;
        const project = lib.optionalId(context, projectId, 'Project');
        const task = lib.optionalId(context, taskId, 'Task ID');
        const tags = lib.idList(context, tagIds, 'Tag IDs');
        if (tags.length) body.tag_ids = tags;
        if (billable === true || billable === 'true') body.billable = true;

        const { workspace } = await lib.urls(context);

        if (!stopTime && !hasDuration) {
            // No end: start a running timer. Toggl stops a timer that is already running.
            if (startTime) body.start = startTime;
            if (project) body.project_id = project;
            if (task) body.task_id = task;
            const { data } = await lib.request(context, {
                method: 'POST',
                url: `${workspace}/tracking/start`,
                data: body
            });
            return context.sendJson(lib.toTimeEntry(data), 'out');
        }

        if (!startTime) {
            throw new context.CancelError('Start is required when Stop or Duration is set.');
        }

        if (stopTime) {
            const seconds = Math.round((new Date(stopTime) - new Date(startTime)) / 1000);
            if (seconds < 0) {
                throw new context.CancelError('Stop must be after Start.');
            }
            body.duration = seconds;
        } else {
            const seconds = Number(duration);
            if (!Number.isFinite(seconds) || seconds < 0) {
                throw new context.CancelError('Duration must be a number of seconds, zero or more.');
            }
            body.duration = Math.round(seconds);
        }
        body.start = startTime;

        // An entry of a task is created under the task; its project is the task's project.
        let url = `${workspace}/time-entries`;
        if (task) {
            url = `${workspace}/tasks/${task}/time-entries`;
        } else if (project) {
            body.project_id = project;
        }

        const { data } = await lib.request(context, { method: 'POST', url, data: body });

        return context.sendJson(lib.toTimeEntry(data), 'out');
    }
};
