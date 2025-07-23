'use strict';

module.exports = {

    async receive(context) {

        const audienceId = context.messages.in.audience_id;
        const contactId = context.messages.in.id;
        const email = context.messages.in.email;

        // Validate required fields
        if (!audienceId) {
            throw new context.CancelError('Audience ID is required!');
        }

        // Either id or email must be provided
        if (!contactId && !email) {
            throw new context.CancelError('Either Contact ID or Email is required!');
        }

        // Use contactId if provided, otherwise use email
        const identifier = contactId || email;

        // Make the API request
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.resend.com/audiences/${audienceId}/contacts/${identifier}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
