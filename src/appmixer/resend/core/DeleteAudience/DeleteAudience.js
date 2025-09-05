/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { audience_id } = context.messages.in.content;

        // Validate required fields
        if (!audience_id) {
            throw new context.CancelError('Audience ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.resend.com/audiences/${audience_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
