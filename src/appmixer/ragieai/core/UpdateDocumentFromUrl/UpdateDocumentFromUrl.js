'use strict';

module.exports = {
    async receive(context) {

        const { documentId, url, mode } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        if (!url) {
            throw new context.CancelError('Url is required!');
        }

        const payload = {
            url: url,
            mode: mode || 'fast'
        };

        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://api.ragie.ai/documents/${documentId}/url`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
