'use strict';

module.exports = {
    async receive(context) {
        const { teamId, name } = context.messages.in.content;

        if (!teamId) {
            throw new context.CancelError('Team ID is required.');
        }

        if (!name) {
            throw new context.CancelError('Inbox Name is required.');
        }

        const body = { name };

        // https://dev.frontapp.com/reference/create-team-inbox
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/teams/${teamId}/inboxes`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
