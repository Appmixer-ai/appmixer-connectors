'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workspaceId, timeEntryId } = context.messages.in.content;

        if (!timeEntryId) {

            throw new context.CancelError('Time Entry ID is required!');

        }

        const id = lib.requireId(context, timeEntryId, 'Time Entry ID');
        const resolvedWorkspaceId = await lib.resolveWorkspaceId(context, workspaceId);

        const { data } = await lib.request(context, {
            method: 'PATCH',
            url: `${lib.API_BASE_URL}/workspaces/${resolvedWorkspaceId}/time_entries/${id}/stop`
        });

        return context.sendJson(data, 'out');
    }
};
