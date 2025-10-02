'use strict';

module.exports = {
    async receive(context) {
        const { inbox_id, teammate_ids } = context.messages.in.content;

        if (!inbox_id) {
            throw new context.CancelError('Inbox ID is required.');
        }

        if (!teammate_ids || (Array.isArray(teammate_ids) ? teammate_ids.length === 0 : !teammate_ids.trim())) {
            throw new context.CancelError('Teammate IDs are required.');
        }

        const requestData = {
            teammate_ids: Array.isArray(teammate_ids) ? teammate_ids : teammate_ids.split(',').map(id => id.trim())
        };

        // API Documentation: https://dev.frontapp.com/reference/removes-inbox-access
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: `https://api2.frontapp.com/inboxes/${inbox_id}/teammates`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};
