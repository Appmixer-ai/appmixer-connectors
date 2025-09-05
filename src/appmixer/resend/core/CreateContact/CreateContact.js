/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { audience_id, email, first_name, last_name, unsubscribed } = context.messages.in.content;

        if (!audience_id) {
            throw new context.CancelError('Audience ID is required!');
        }
        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url: `https://api.resend.com/audiences/${audience_id}/contacts`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                email, first_name, last_name, unsubscribed
            }
        });

        return context.sendJson(responseData, 'out');
    }
};
