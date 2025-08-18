'use strict';

module.exports = {
    async receive(context) {
        let { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }
        // Accept either raw id (c123...) or resource name (people/c123...)
        if (typeof contactId === 'string' && contactId.startsWith('people/')) {
            contactId = contactId.split('/')[1];
        }

        // https://developers.google.com/people/api/rest/v1/people/deleteContact
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: `https://people.googleapis.com/v1/people/${contactId}:deleteContact`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
