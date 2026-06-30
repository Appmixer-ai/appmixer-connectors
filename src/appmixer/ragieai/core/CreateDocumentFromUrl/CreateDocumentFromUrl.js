'use strict';

module.exports = {

    async receive(context) {

        const { url, name, metadata } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('Document URL is required!');
        }

        const requestBody = {
            url
        };

        if (name) {
            requestBody.name = name;
        }

        if (metadata) {
            try {
                requestBody.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (error) {
                throw new context.CancelError('Invalid metadata JSON format');
            }
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.ragie.ai/documents/url',
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
