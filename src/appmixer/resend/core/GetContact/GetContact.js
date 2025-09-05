/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { audience_id, id: contactId, email } = context.messages.in.content;

        // Validate required fields
        if (!audience_id) {
            throw new context.CancelError('Audience ID is required!');
        }

        // Either id or email must be provided
        if (!contactId && !email) {
            throw new context.CancelError('Either Contact ID or Email is required!');
        }

        // Use contactId if provided, otherwise use email
        const identifier = contactId || email;

        // Make the API request
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.resend.com/audiences/${audience_id}/contacts/${identifier}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
