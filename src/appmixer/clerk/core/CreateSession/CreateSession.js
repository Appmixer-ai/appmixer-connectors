'use strict';

module.exports = {
    async receive(context) {
        const { userId } = context.messages.in.content;

        if (!userId) {
            throw new context.CancelError('User ID is required');
        }

        // https://clerk.com/docs/references/backend/overview#sessions
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.clerk.com/v1/sessions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                user_id: userId
            }
        });

        return context.sendJson(data, 'out');
    }
};
