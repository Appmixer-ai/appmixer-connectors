'use strict';

module.exports = {
    async receive(context) {
        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Email ID is required');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.clerk.com/v1/email_addresses/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
