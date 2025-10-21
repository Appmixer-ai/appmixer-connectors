'use strict';

module.exports = {
    async receive(context) {
        const { inboxId, teammateIds } = context.messages.in.content;

        if (!inboxId) {
            throw new context.CancelError('Inbox ID is required.');
        }

        if (!teammateIds || (Array.isArray(teammateIds) ? teammateIds.length === 0 : !teammateIds.trim())) {
            throw new context.CancelError('Teammate IDs are required.');
        }

        const requestData = {
            teammate_ids: Array.isArray(teammateIds) ? teammateIds : teammateIds.split(',').map(id => id.trim())
        };

        // https://dev.frontapp.com/reference/add-inbox-access
        await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/inboxes/${inboxId}/teammates`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};
