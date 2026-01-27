'use strict';

module.exports = {
    async receive(context) {
        const { squadId, name, assistantId } = context.messages.in.content;

        if (!squadId) {
            throw new context.CancelError('Squad ID is required!');
        }

        const payload = {};

        if (name) {
            payload.name = name;
        }

        if (assistantId) {
            payload.members = [
                {
                    assistantId: assistantId
                }
            ];
        }

        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.vapi.ai/squad/${squadId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson({}, 'out');
    }
};
