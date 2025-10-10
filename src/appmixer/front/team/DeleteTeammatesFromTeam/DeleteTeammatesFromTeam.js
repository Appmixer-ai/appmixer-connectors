'use strict';

module.exports = {
    async receive(context) {
        const { teamId, teammateIds } = context.messages.in.content;

        if (!teamId) {
            throw new context.CancelError('Team ID is required.');
        }

        if (!teammateIds || (Array.isArray(teammateIds) ? teammateIds.length === 0 : !teammateIds.trim())) {
            throw new context.CancelError('Teammate IDs are required.');
        }

        const requestData = {
            teammate_ids: Array.isArray(teammateIds) ? teammateIds : teammateIds.split(',').map(id => id.trim())
        };

        // https://dev.frontapp.com/reference/remove-teammates-from-team
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api2.frontapp.com/teams/${teamId}/teammates`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};
