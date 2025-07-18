

'use strict';

module.exports = {
    async receive(context) {
        const { id, userId } = context.messages.in.content;

        if (!id) {
            throw new Error('Organization ID is required');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Make API request to remove user from organization
        // The endpoint expects the user_id, not the membership ID
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.clerk.com/v1/organizations/${id}/memberships/${userId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
