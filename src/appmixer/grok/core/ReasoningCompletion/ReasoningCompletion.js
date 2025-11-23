'use strict';

module.exports = {

    async receive(context) {

        const {
            model,
            messages,
            reasoningEffort,
            temperature,
            topP,
            maxTokens,
            stream
        } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }

        if (!messages || messages.ADD?.length === 0) {
            throw new context.CancelError('Messages is required!');
        }

        // Extract the actual messages array from the ADD property
        const messagesArray = messages.ADD || messages;

        const body = {
            model,
            messages: messagesArray,
            reasoning_effort: reasoningEffort || 'medium',
            stream: stream || false
        };

        // Add optional parameters if provided
        if (temperature !== undefined) {
            body.temperature = temperature;
        }
        if (topP !== undefined) {
            body.top_p = topP;
        }
        if (maxTokens !== undefined) {
            body.max_tokens = maxTokens;
        }

        // https://grok-api.apidog.io/reasoning-15799160e0
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson(response.data, 'out');
    }
};
