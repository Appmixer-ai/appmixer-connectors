'use strict';

module.exports = {
    async receive(context) {
        const { inboxId, type, settings } = context.messages.in.content;

        if (!inboxId) {
            throw new context.CancelError('Inbox ID is required.');
        }

        if (!type) {
            throw new context.CancelError('Channel type is required.');
        }

        const requestData = { type };

        if (settings) {
            try {
                requestData.settings = typeof settings === 'string' ? JSON.parse(settings) : settings;
            } catch (error) {
                throw new context.CancelError('Invalid JSON format in settings field.');
            }
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/inboxes/${inboxId}/channels`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
