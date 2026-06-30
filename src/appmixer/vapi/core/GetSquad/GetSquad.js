'use strict';

module.exports = {
    async receive(context) {
        const { squadId } = context.messages.in.content;

        if (!squadId) {
            throw new context.CancelError('Squad ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.vapi.ai/squad/${squadId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
