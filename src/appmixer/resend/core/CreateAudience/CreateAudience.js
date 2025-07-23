'use strict';

module.exports = {

    async receive(context) {

        const name = context.messages.in.name;

        // Validate required fields
        if (!name) {
            throw new context.CancelError('Audience name is required!');
        }

        // Make the API request
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.resend.com/audiences',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                name
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
