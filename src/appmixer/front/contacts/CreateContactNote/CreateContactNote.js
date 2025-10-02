'use strict';

module.exports = {
    async receive(context) {
        const { contactId, body, author_id } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required.');
        }

        if (!body) {
            throw new context.CancelError('Note body is required.');
        }

        const requestData = { body };

        if (author_id) {
            requestData.author_id = author_id;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/contacts/${contactId}/notes`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
