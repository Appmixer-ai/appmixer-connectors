'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            content, description, projectId, sectionId, parentId, order,
            labels, priority, dueString, dueDate, dueDatetime, dueLang,
            assigneeId, duration, durationUnit
        } = context.messages.in.content;

        const body = { content };

        if (description) body.description = description;
        if (projectId) body.project_id = projectId;
        if (sectionId) body.section_id = sectionId;
        if (parentId) body.parent_id = parentId;
        if (order !== undefined) body.order = order;
        if (labels) body.labels = labels.split(',').map(l => l.trim());
        if (priority) body.priority = priority;
        if (dueString) body.due_string = dueString;
        if (dueDate) body.due_date = dueDate.split('T')[0];
        if (dueDatetime) body.due_datetime = dueDatetime;
        if (dueLang) body.due_lang = dueLang;
        if (assigneeId) body.assignee_id = assigneeId;
        if (duration && durationUnit) {
            body.duration = duration;
            body.duration_unit = durationUnit;
        }

        const task = await lib.apiRequest(context, '/tasks', {
            method: 'POST',
            data: body
        });

        return context.sendJson(task, 'out');
    }
};
