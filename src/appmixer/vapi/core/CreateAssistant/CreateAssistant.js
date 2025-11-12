'use strict';

module.exports = {
    async receive(context) {
        const { name, firstMessage, model, voice } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const payload = { name };

        if (firstMessage) {
            payload.firstMessage = firstMessage;
        }

        if (model) {
            payload.model = typeof model === 'string' ? JSON.parse(model) : model;
        }

        if (voice) {
            payload.voice = typeof voice === 'string' ? JSON.parse(voice) : voice;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.vapi.ai/assistant',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
