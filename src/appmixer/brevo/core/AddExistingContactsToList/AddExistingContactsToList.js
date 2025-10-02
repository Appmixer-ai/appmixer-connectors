'use strict';

module.exports = {
    async receive(context) {
        const { listId, contactEmails } = context.messages.in.content;
        if (!listId) {
            throw new context.CancelError('List ID is required');
        }

        if (!contactEmails) {
            throw new context.CancelError('Emails is required');
        }


        // https://developers.brevo.com/reference/addcontacttolist-1
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`,
            headers: {
                'api-key': `${context.auth.apiKey}`
            },
            data: {
                emails: contactEmails.split(',')
            }
        });

        return context.sendJson(data.contacts, 'out');
    }
};
