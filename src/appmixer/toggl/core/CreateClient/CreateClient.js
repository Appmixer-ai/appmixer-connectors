'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workspaceId, name, notes } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const resolvedWorkspaceId = await lib.resolveWorkspaceId(context, workspaceId);

        const body = { name };
        if (notes) body.notes = notes;

        const { data } = await lib.request(context, {
            method: 'POST',
            url: `${lib.API_BASE_URL}/workspaces/${resolvedWorkspaceId}/clients`,
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
