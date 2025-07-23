'use strict';

module.exports = {

    async receive(context) {

        const audienceId = context.messages.in.audience_id;
        const contactId = context.messages.in.id;
        const email = context.messages.in.email;
        const firstName = context.messages.in.first_name;
        const lastName = context.messages.in.last_name;
        const unsubscribed = context.messages.in.unsubscribed;

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

        // Prepare request data with only provided fields
        const data = {};
        if (firstName) data.first_name = firstName;
        if (lastName) data.last_name = lastName;
        if (typeof unsubscribed === 'boolean') data.unsubscribed = unsubscribed;

        // Make the API request
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.resend.com/audiences/${audienceId}/contacts/${identifier}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data
        });

        return context.sendJson({}, 'out');
    }
};
