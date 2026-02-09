'use strict';

module.exports = {
    async receive(context) {

        const { documentId } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.ragie.ai/documents/${documentId}/summary`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
