'use strict';

module.exports = {

    async receive(context) {

        const { audienceId } = context.messages.in.content;

        // Validate required fields
        if (!audienceId) {
            throw new context.CancelError('Audience ID is required!');
        }

        // Make the API request
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.resend.com/audiences/${audienceId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
