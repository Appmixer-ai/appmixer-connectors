'use strict';

module.exports = {
    async receive(context) {
        const { team_id, teammate_ids } = context.messages.in.content;

        if (!team_id) {
            throw new context.CancelError('Team ID is required.');
        }

        if (!teammate_ids || (Array.isArray(teammate_ids) ? teammate_ids.length === 0 : !teammate_ids.trim())) {
            throw new context.CancelError('Teammate IDs are required.');
        }

        const requestData = {
            teammate_ids: Array.isArray(teammate_ids) ? teammate_ids : teammate_ids.split(',').map(id => id.trim())
        };

        // API Documentation: https://dev.frontapp.com/reference/add-teammates-to-team
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/teams/${team_id}/teammates`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson({
            success: true,
            teammates: requestData.teammate_ids,
            team_id: team_id,
            ...data
        }, 'out');
    }
};
