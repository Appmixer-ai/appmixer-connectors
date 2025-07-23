'use strict';

module.exports = {

    async receive(context) {

        // Make the API request
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.resend.com/audiences',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
