'use strict';

module.exports = {
    async receive(context) {
        const { contact_id } = context.messages.in.content;

        if (!contact_id) {
            throw new context.CancelError('Contact ID is required!');
        }

        // https://www.twilio.com/docs/sendgrid/api-reference/contacts/get-a-contact
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.sendgrid.com/v3/marketing/contacts/${contact_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            }
        });

        return context.sendJson(data, 'out');
    }
};
