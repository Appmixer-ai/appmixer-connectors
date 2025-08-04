'use strict';

module.exports = {
    async receive(context) {
        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('User ID is required');
        }

        await context.httpRequest({
            method: 'POST',
            url: `https://api.clerk.com/v1/users/${id}/lock`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
