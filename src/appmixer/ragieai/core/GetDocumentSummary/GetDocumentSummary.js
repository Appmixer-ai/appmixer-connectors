'use strict';

module.exports = {
    async receive(context) {

        const { document_id } = context.messages.in.content;

        if (!document_id) {
            throw new context.CancelError('Document Id is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.ragie.ai/documents/${document_id}/summary`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Transform the API response to match the declared schema
        const transformedData = {
            document_id: data['Document Id'] || document_id,
            summary: data.Summary || ''
        };

        return context.sendJson(transformedData, 'out');
    }
};
