'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workspaceId, name, clientId, isPrivate, color, billable } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const resolvedWorkspaceId = await lib.resolveWorkspaceId(context, workspaceId);

        const body = {
            name,
            active: true,
            is_private: isPrivate !== false
        };
        const client = lib.optionalId(context, clientId, 'Client ID');
        if (client) body.client_id = client;
        if (color) body.color = color;
        if (billable) body.billable = true;

        const { data } = await lib.request(context, {
            method: 'POST',
            url: `${lib.API_BASE_URL}/workspaces/${resolvedWorkspaceId}/projects`,
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
