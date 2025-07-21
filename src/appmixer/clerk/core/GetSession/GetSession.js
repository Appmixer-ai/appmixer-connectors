
'use strict';

module.exports = {
    async receive(context) {
        const { id } = context.messages.in.content;

        // https://clerk.com/docs/references/backend/overview#sessions
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.clerk.com/v1/sessions/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
