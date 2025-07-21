'use strict';

module.exports = {
    async receive(context) {
        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Organization ID is required');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.clerk.com/v1/organizations/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
