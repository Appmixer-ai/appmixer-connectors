'use strict';

module.exports = {

    async receive(context) {

        // Make the API request
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.resend.com/audiences',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
