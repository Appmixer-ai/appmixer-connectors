
'use strict';

module.exports = {
    async receive(context) {
        const { userId, emailAddress } = context.messages.in.content;

        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!emailAddress) {
            throw new Error('Email address is required');
        }

        // Prepare the request body
        const body = {
            user_id: userId,
            email_address: emailAddress
        };

        // Make API request
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.clerk.com/v1/email_addresses',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: body
        });

        // Return the result
        return context.sendJson(data, 'out');
    }
};
