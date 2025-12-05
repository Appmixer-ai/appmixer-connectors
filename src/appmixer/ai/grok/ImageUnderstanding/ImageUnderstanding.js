'use strict';

module.exports = {
    async receive(context) {

        const { model, text, imageUrl, imageDetail, maxTokens } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }

        if (!imageUrl) {
            throw new context.CancelError('Image URL is required!');
        }

        // Build content array based on content type
        const content = [];

        if (text) {
            content.push({
                type: 'text',
                text: text
            });
        }

        content.push({
            type: 'image_url',
            image_url: {
                url: imageUrl,
                detail: imageDetail || 'auto'
            }
        });

        const requestBody = {
            model: model,
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ]
        };

        if (maxTokens) {
            requestBody.max_tokens = maxTokens;
        }

        // https://grok-api.apidog.io/image-understanding-934095m0
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
