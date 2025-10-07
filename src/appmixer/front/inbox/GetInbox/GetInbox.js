'use strict';

module.exports = {
    async receive(context) {
        const { inboxId } = context.messages.in.content;

        if (!inboxId) {
            throw new context.CancelError('Inbox ID is required.');
        }

        // https://dev.frontapp.com/reference/get-inbox
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/inboxes/${inboxId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
