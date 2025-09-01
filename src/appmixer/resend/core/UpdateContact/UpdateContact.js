/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { audience_id, id: contactId, email, first_name, last_name, unsubscribed } = context.messages.in.content;

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

        // Prepare request data with only provided fields
        const data = {};
        if (first_name) data.first_name = first_name;
        if (last_name) data.last_name = last_name;
        if (typeof unsubscribed === 'boolean') data.unsubscribed = unsubscribed;

        // Make the API request
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.resend.com/audiences/${audience_id}/contacts/${identifier}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data
        });

        return context.sendJson({}, 'out');
    }
};
