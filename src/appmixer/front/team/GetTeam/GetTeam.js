'use strict';

module.exports = {
    async receive(context) {
        const { team_id } = context.messages.in.content;

        if (!team_id) {
            throw new context.CancelError('Team ID is required.');
        }

        // API Documentation: https://dev.frontapp.com/reference/get-team
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/teams/${team_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
