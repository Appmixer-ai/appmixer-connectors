
'use strict';
module.exports = {
    async receive(context) {

        const { sessionId } = context.messages.in.content;

        // https://clerk.com/docs/references/backend/overview#sessions
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.clerk.com/v1/sessions/${sessionId}/revoke`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            json: true
        });

        return context.sendJson(data, 'out');
    }
};
