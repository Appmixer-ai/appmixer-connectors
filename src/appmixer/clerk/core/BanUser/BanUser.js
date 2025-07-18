
'use strict';

module.exports = {
    async receive(context) {
        const { userId, reason } = context.messages.in.content;

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Prepare the request body
        const body = {};
        if (reason) body.reason = reason;

        // Make API request
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.clerk.com/v1/users/${userId}/ban`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: body
        });

        // Return the result
        return context.sendJson(data, 'out');
    }
};
