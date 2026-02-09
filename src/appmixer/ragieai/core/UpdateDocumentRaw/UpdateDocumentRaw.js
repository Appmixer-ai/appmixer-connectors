'use strict';

module.exports = {
    async receive(context) {
        const { documentId, data } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        if (!data) {
            throw new context.CancelError('Data is required!');
        }

        const { data: updatedResult } = await context.httpRequest({
            method: 'PUT',
            url: `https://api.ragie.ai/documents/${documentId}/raw`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                data: data
            }
        });

        return context.sendJson(updatedResult, 'out');
    }
};
