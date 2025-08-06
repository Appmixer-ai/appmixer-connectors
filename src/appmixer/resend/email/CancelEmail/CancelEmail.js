'use strict';

module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        // Validate required fields
        if (!id) {
            throw new context.CancelError('Email ID is required!');
        }

        // https://resend.com/docs/api-reference/emails/cancel
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.resend.com/emails/${id}/cancel`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
