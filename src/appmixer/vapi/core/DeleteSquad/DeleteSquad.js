'use strict';

module.exports = {
    async receive(context) {
        const { squadId } = context.messages.in.content;

        if (!squadId) {
            throw new context.CancelError('Squad ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.vapi.ai/squad/${squadId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
