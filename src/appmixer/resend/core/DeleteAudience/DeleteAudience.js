'use strict';

module.exports = {

    async receive(context) {

        const { audienceId } = context.messages.in.content;

        // Validate required fields
        if (!audienceId) {
            throw new context.CancelError('Audience ID is required!');
        }

        // Make the API request
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.resend.com/audiences/${audienceId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
