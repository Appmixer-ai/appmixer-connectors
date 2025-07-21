'use strict';

module.exports = {
    async receive(context) {
        const { id, userId } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Organization ID is required');
        }
        if (!userId) {
            throw new context.CancelError('User ID is required');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.clerk.com/v1/organizations/${id}/memberships/${userId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
