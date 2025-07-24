'use strict';

module.exports = {

    async receive(context) {

        const { audienceId, email, firstName, lastName, unsubscribed } = context.messages.in.content;

        if (!audienceId) {
            throw new context.CancelError('Audience ID is required!');
        }
        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const data = {
            email
        };

        if (firstName) data.first_name = firstName;
        if (lastName) data.last_name = lastName;
        if (typeof unsubscribed === 'boolean') data.unsubscribed = unsubscribed;

        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url: `https://api.resend.com/audiences/${audienceId}/contacts`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data
        });

        return context.sendJson(responseData, 'out');
    }
};
