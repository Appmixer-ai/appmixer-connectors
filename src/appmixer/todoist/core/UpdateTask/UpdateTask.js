'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            taskId, content, description, labels, priority,
            dueString, dueDate, dueDatetime, dueLang,
            assigneeId, duration, durationUnit
        } = context.messages.in.content;

        if (!taskId) {
            throw new context.CancelError('Task ID is required.');
        }

        const body = {};

        if (content) body.content = content;
        if (description !== undefined) body.description = description;
        if (labels) body.labels = labels.split(',').map(l => l.trim());
        if (priority) body.priority = priority;
        if (dueString) body.due_string = dueString;
        if (dueDate) body.due_date = dueDate;
        if (dueDatetime) body.due_datetime = dueDatetime;
        if (dueLang) body.due_lang = dueLang;
        if (assigneeId) body.assignee_id = assigneeId;
        if (duration && durationUnit) {
            body.duration = duration;
            body.duration_unit = durationUnit;
        }

        const task = await lib.apiRequest(context, `/tasks/${taskId}`, {
            method: 'POST',
            data: body
        });

        return context.sendJson(task, 'out');
    }
};
