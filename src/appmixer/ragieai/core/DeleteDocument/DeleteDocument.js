'use strict';

module.exports = {

    async receive(context) {

        const { documentId } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.ragie.ai/documents/${documentId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
