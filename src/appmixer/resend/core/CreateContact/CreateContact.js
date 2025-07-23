'use strict';

module.exports = {

    async receive(context) {

        const audienceId = context.messages.in.audience_id;
        const email = context.messages.in.email;
        const firstName = context.messages.in.first_name;
        const lastName = context.messages.in.last_name;
        const unsubscribed = context.messages.in.unsubscribed;

        // Validate required fields
        if (!audienceId) {
            throw new context.CancelError('Audience ID is required!');
        }
        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        // Prepare request data
        const data = {
            email
        };

        // Add optional fields if provided
        if (firstName) data.first_name = firstName;
        if (lastName) data.last_name = lastName;
        if (typeof unsubscribed === 'boolean') data.unsubscribed = unsubscribed;

        // Make the API request
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.resend.com/audiences/${audienceId}/contacts`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data
        });

        return context.sendJson(response.data, 'out');
    }
};
