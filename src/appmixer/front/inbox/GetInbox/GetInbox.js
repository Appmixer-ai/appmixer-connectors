'use strict';

module.exports = {
    async receive(context) {
        const { inbox_id } = context.messages.in.content;

        if (!inbox_id) {
            throw new context.CancelError('Inbox ID is required.');
        }

        // https://dev.frontapp.com/reference/get-inbox
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/inboxes/${inbox_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
