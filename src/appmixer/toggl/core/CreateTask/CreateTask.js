'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workspaceId, projectId, name, estimatedSeconds, active } = context.messages.in.content;

        const project = lib.requireId(context, projectId, 'Project');
        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const resolvedWorkspaceId = await lib.resolveWorkspaceId(context, workspaceId);

        const body = { name, active: active !== false };
        if (estimatedSeconds !== undefined && estimatedSeconds !== null && estimatedSeconds !== '') {
            body.estimated_seconds = Number(estimatedSeconds);
        }

        const { data } = await lib.request(context, {
            method: 'POST',
            url: `${lib.API_BASE_URL}/workspaces/${resolvedWorkspaceId}/projects/${project}/tasks`,
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
