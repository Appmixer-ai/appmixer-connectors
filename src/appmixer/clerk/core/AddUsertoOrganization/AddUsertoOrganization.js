
'use strict';

module.exports = {
    async receive(context) {
        const { id, userId, role = 'org:member' } = context.messages.in.content;

        if (!id) {
            throw new Error('Organization ID is required');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Make API request to add user to organization
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.clerk.com/v1/organizations/${id}/memberships`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                user_id: userId,
                role
            }
        });

        return context.sendJson(data, 'out');
    }
};
