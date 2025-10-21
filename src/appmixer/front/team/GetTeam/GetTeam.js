'use strict';

module.exports = {
    async receive(context) {
        const { teamId } = context.messages.in.content;

        if (!teamId) {
            throw new context.CancelError('Team ID is required.');
        }

        // https://dev.frontapp.com/reference/get-team
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/teams/${teamId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
