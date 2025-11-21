'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { model, role, contentType, text, imageUrl, imageDetail, maxTokens } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }

        if (!role) {
            throw new context.CancelError('Role is required!');
        }

        if (!contentType) {
            throw new context.CancelError('Content Type is required!');
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

        if (contentType === 'image_url') {
            content.push({
                type: 'image_url',
                image_url: {
                    url: imageUrl,
                    detail: imageDetail || 'auto'
                }
            });
        }

        const requestBody = {
            model: model,
            messages: [
                {
                    role: role,
                    content: content
                }
            ]
        };

        if (maxTokens) {
            requestBody.max_tokens = maxTokens;
        }

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
