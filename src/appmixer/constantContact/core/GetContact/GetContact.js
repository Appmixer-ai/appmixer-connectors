'use strict';

module.exports = {
    async receive(context) {

        const { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Contacts/getContact
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.cc.email/v3/contacts/${contactId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
