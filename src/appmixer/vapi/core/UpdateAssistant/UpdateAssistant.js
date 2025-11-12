'use strict';

module.exports = {
    async receive(context) {
        const { assistantId, name, firstMessage, model, voice } = context.messages.in.content;

        if (!assistantId) {
            throw new context.CancelError('Assistant ID is required!');
        }

        const payload = {};

        if (name) {
            payload.name = name;
        }

        if (firstMessage) {
            payload.firstMessage = firstMessage;
        }

        if (model) {
            payload.model = typeof model === 'string' ? JSON.parse(model) : model;
        }

        if (voice) {
            payload.voice = typeof voice === 'string' ? JSON.parse(voice) : voice;
        }

        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.vapi.ai/assistant/${assistantId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson({}, 'out');
    }
};
