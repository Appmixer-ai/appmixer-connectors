
'use strict';

module.exports = {
    async receive(context) {
        const { organizationId } = context.messages.in.content;

        if (!organizationId) {
            throw new Error('Organization ID is required');
        }

        // Make API request
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.clerk.com/v1/organizations/${organizationId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Return the result
        return context.sendJson(data, 'out');
    }
};
