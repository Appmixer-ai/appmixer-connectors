'use strict';

module.exports = {

    async receive(context) {

        const { title, content } = context.messages.in.content;

        // Validate required fields
        if (!title) {
            throw new context.CancelError('Title is required!');
        }

        const requestBody = {
            title: title.trim()
        };

        // https://developers.google.com/docs/api/reference/rest/v1/documents/create
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://docs.googleapis.com/v1/documents',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        // If content is provided, add it to the document
        if (content) {
            const requests = [{
                insertText: {
                    location: {
                        index: 1
                    },
                    text: content
                }
            }];

            await context.httpRequest({
                method: 'POST',
                url: `https://docs.googleapis.com/v1/documents/${data.documentId}:batchUpdate`,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: { requests }
            });
        }

        return context.sendJson({
            documentId: data.documentId,
            title: data.title,
            revisionId: data.revisionId,
            documentUrl: `https://docs.google.com/document/d/${data.documentId}/edit`
        }, 'out');
    }
};
