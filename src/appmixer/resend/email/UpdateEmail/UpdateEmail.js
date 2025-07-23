/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const { id, scheduled_at } = context.messages.in.content;

        // Validate required fields
        if (!id) {
            throw new context.CancelError('Email ID is required!');
        }

        // Prepare request data
        const data = {};

        // Add optional fields if provided
        if (scheduled_at) {
            data.scheduled_at = scheduled_at;
        }

        // https://resend.com/docs/api-reference/emails/update
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.resend.com/emails/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data
        });

        return context.sendJson({}, 'out');
    }
};
