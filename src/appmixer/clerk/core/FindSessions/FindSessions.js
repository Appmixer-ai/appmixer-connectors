
'use strict';

module.exports = {
    async receive(context) {
        const { userId, limit } = context.messages.in.content;
        const params = {};

        if (userId) {
            params.user_id = userId;
        }

        if (limit) {
            params.limit = limit;
        }

        // https://clerk.com/docs/references/backend/overview#sessions
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.clerk.com/v1/sessions',
            params,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Always return an object with a 'sessions' array
        let sessions = [];
        if (Array.isArray(data)) {
            sessions = data;
        } else if (data && Array.isArray(data.sessions)) {
            sessions = data.sessions;
        }

        return context.sendJson({ sessions }, 'out');
    }
};
