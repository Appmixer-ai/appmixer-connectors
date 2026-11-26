'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, projectId, description, estimatedMinutes, priority } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const body = { name };
        const project = lib.optionalId(context, projectId, 'Project');
        if (project) body.project_id = project;
        if (description) body.description = description;
        if (estimatedMinutes !== undefined && estimatedMinutes !== null && estimatedMinutes !== '') {
            const minutes = Number(estimatedMinutes);
            if (!Number.isFinite(minutes) || minutes < 0) {
                throw new context.CancelError('Estimate must be a number of minutes, zero or more.');
            }
            body.estimated_mins = Math.round(minutes);
        }
        if (priority) body.priority = priority;

        const { workspace } = await lib.urls(context);
        const { data } = await lib.request(context, {
            method: 'POST',
            url: `${workspace}/tasks`,
            data: body
        });

        return context.sendJson(lib.withoutNulls({
            id: data.id,
            workspace_id: data.workspace_id,
            project_id: data.project_id,
            status_id: data.status_id,
            toggl_user_id: data.toggl_user_id,
            name: data.name,
            description: data.description,
            estimated_mins: data.estimated_mins,
            priority: data.priority,
            private: data.private,
            created_at: data.created_at,
            updated_at: data.updated_at
        }), 'out');
    }
};
