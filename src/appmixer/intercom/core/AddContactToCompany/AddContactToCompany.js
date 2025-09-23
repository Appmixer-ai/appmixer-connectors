/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { contact_id, company_id } = context.messages.in.content;

        // Validate required inputs
        if (!contact_id) {
            throw new context.CancelError('Contact ID is required.');
        }

        if (!company_id) {
            throw new context.CancelError('Company ID is required.');
        }

        // https://developers.intercom.com/reference#attach-a-contact-to-a-company
        await context.httpRequest({
            method: 'POST',
            url: `https://api.intercom.io/contacts/${contact_id}/companies`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: {
                id: company_id
            }
        });

        return context.sendJson({}, 'out');
    }
};
