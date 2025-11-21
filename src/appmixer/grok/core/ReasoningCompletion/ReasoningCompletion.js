'use strict';

module.exports = {

    async receive(context) {

        const {
            model,
            messages,
            reasoning_effort,
            temperature,
            top_p,
            max_tokens,
            stream
        } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }

        if (!messages) {
            throw new context.CancelError('Messages is required!');
        }

        // Build the messages array ensuring proper structure
        const messagesArray = Array.isArray(messages) ? messages : [messages];

        // https://docs.x.ai/docs/chat-completions
        const body = {
            model,
            messages: messagesArray,
            reasoning_effort: reasoning_effort || 'medium',
            stream: stream || false
        };

        // Add optional parameters if provided
        if (temperature !== undefined) {
            body.temperature = temperature;
        }
        if (top_p !== undefined) {
            body.top_p = top_p;
        }
        if (max_tokens !== undefined) {
            body.max_tokens = max_tokens;
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        // Handle streaming response
        if (stream && response.data) {
            // For streaming responses, collect the data stream
            let fullResponse = '';

            if (typeof response.data === 'string') {
                fullResponse = response.data;
            } else if (response.data && typeof response.data === 'object') {
                // If it's an object, convert to JSON string
                fullResponse = JSON.stringify(response.data);
            }

            return context.sendJson(fullResponse, 'out');
        } else {
            // For non-streaming responses, send the data object
            return context.sendJson(response.data, 'out');
        }
    }
};
