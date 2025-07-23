'use strict';

module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Email ID is required!');
        }

        // https://resend.com/docs/api-reference/emails#retrieve-email
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.resend.com/emails/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
