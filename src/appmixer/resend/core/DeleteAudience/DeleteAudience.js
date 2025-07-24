/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { audience_id } = context.messages.in.content;

        // Validate required fields
        if (!audience_id) {
            throw new context.CancelError('Audience ID is required!');
        }

        // Make the API request
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.resend.com/audiences/${audience_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
