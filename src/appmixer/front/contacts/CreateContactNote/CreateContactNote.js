'use strict';

module.exports = {
    async receive(context) {
        const { contactId, body, authorId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required.');
        }

        if (!body) {
            throw new context.CancelError('Note body is required.');
        }

        if (!authorId) {
            throw new context.CancelError('Author ID is required.');
        }

        const requestData = { body, author_id: authorId };

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
