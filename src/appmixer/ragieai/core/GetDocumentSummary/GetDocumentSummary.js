'use strict';

module.exports = {
    async receive(context) {

        const { documentId } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document Id is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.ragie.ai/documents/${documentId}/summary`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Transform the API response to match the declared schema
        const transformedData = {
            documentId: data['Document Id'] || documentId,
            summary: data.Summary || ''
        };

        return context.sendJson(transformedData, 'out');
    }
};
