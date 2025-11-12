'use strict';

module.exports = {

    async receive(context) {

        const { name, content, metadata } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Document name is required!');
        }

        if (!content) {
            throw new context.CancelError('Document content is required!');
        }

        const requestBody = {
            name,
            content
        };

        if (metadata) {
            try {
                requestBody.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (error) {
                throw new context.CancelError('Invalid metadata JSON format');
            }
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.ragie.ai/documents',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
