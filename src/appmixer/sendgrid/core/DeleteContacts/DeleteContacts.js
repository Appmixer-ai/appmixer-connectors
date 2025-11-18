'use strict';

module.exports = {
    async receive(context) {

        const { ids } = context.messages.in.content;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new context.CancelError('Contact IDs are required!');
        }

        // https://www.twilio.com/docs/sendgrid/api-reference/contacts/delete-contacts
        // The API expects ids as a comma-separated string in query parameters
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: 'https://api.sendgrid.com/v3/marketing/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            params: {
                ids: ids.join(',')
            }
        });

        return context.sendJson(data, 'out');
    }
};
