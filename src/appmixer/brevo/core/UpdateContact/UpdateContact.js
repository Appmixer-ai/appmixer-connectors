'use strict';

module.exports = {
    async receive(context) {
        const { contactId, email, emailBlacklisted, smsBlacklisted, listIds } = context.messages.in.content;
        if (!contactId) {
            throw new context.CancelError('Contact ID is required');
        }


        // https://developers.brevo.com/reference/updatecontact
        await context.httpRequest({
            method: 'PUT',
            url: `https://api.brevo.com/v3/contacts/${contactId}`,
            headers: {
                'api-key': `${context.auth.apiKey}`
            },
            data: {
                email,
                emailBlacklisted,
                smsBlacklisted,
                listIds: listIds?.split(',').map(id => +id)
            }
        });

        return context.sendJson({ id: contactId }, 'out');
    }
};
