'use strict';

module.exports = {
    async receive(context) {
        const { userId } = context.messages.in.content;

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Make API request
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.clerk.com/v1/users/${userId}/lock`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Return the result
        return context.sendJson(data, 'out');
    }
};
