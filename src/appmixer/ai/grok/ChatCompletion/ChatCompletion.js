'use strict';

module.exports = {

    async receive(context) {

        const {
            model,
            messages,
            stream,
            temperature
        } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }

        if (!messages || messages.ADD?.length === 0) {
            throw new context.CancelError('Messages is required!');
        }

        // Build request payload
        const payload = {
            model,
            messages: messages.ADD,
            stream: stream || false
        };

        if (temperature !== undefined && temperature !== null) {
            payload.temperature = temperature;
        }

        // https://grok-api.apidog.io/chat-15796842e0
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
