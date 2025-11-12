'use strict';

module.exports = {
    async receive(context) {
        const { callId } = context.messages.in.content;

        if (!callId) {
            throw new context.CancelError('Call ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.vapi.ai/call/${callId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
