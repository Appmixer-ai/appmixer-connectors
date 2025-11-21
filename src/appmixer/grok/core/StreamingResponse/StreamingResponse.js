'use strict';

module.exports = {
    async receive(context) {

        const { model, role, content, stream, temperature, max_tokens } = context.messages.in.content;

        // Validate required inputs
        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!role) {
            throw new context.CancelError('Role is required!');
        }
        if (!content) {
            throw new context.CancelError('Content is required!');
        }

        // Build messages array
        const messages = [
            {
                role: role,
                content: content
            }
        ];

        // Prepare request body
        const requestBody = {
            model: model,
            messages: messages,
            stream: stream !== false
        };

        // Add optional parameters if provided
        if (temperature !== undefined && temperature !== null) {
            requestBody.temperature = temperature;
        }
        if (max_tokens !== undefined && max_tokens !== null) {
            requestBody.max_tokens = max_tokens;
        }

        // https://docs.x.ai/docs/streaming
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        // Handle streaming response
        if (stream !== false && response.data) {
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
            // For non-streaming responses, send as string
            const responseString = typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data);
            return context.sendJson(responseString, 'out');
        }
    }
};
