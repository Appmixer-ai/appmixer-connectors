'use strict';

module.exports = {
    async receive(context) {
        const { name, is_private } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Inbox name is required.');
        }

        const requestData = { name };

        if (typeof is_private === 'boolean') {
            requestData.is_private = is_private;
        }

        // API Documentation: https://dev.frontapp.com/reference/create-inbox
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api2.frontapp.com/inboxes',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
