'use strict';

module.exports = {

    async receive(context) {

        const { documentId, name, metadata } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        const requestBody = {};

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

        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.ragie.ai/documents/${documentId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson({}, 'out');
    }
};
