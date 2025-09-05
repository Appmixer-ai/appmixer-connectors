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
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.resend.com/audiences/${audience_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
