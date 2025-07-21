
'use strict';

module.exports = {
    async receive(context) {
        const { id } = context.messages.in.content;

        // https://clerk.com/docs/references/backend/overview#sessions
        await context.httpRequest({
            method: 'POST',
            url: `https://api.clerk.com/v1/sessions/${id}/revoke`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
