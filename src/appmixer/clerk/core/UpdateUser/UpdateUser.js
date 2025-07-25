'use strict';

module.exports = {
    async receive(context) {

        const { id, email, firstName, lastName } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('User ID is required');
        }

        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.clerk.com/v1/users/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                email, first_name: firstName, last_name: lastName
            }
        });

        return context.sendJson({}, 'out');
    }
};
