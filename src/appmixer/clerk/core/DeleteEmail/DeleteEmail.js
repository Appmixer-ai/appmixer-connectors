
'use strict';

module.exports = {
    async receive(context) {
        const { emailId } = context.messages.in.content;

        if (!emailId) {
            throw new Error('Email ID is required');
        }

        // Make API request
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.clerk.com/v1/email_addresses/${emailId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Return the result
        return context.sendJson(data, 'out');
    }
};
