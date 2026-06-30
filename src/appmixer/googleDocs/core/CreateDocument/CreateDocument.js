'use strict';

const { htmlToGoogleDocsRequests } = require('../../lib');

module.exports = {

    async receive(context) {

        const { title, contentType, content } = context.messages.in.content;

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

        // If content is provided, insert it into the document
        if (content) {
            let requests;

            if (contentType === 'html') {
                // Convert HTML to Google Docs batchUpdate requests
                const result = htmlToGoogleDocsRequests(content, 1);
                requests = result.requests;
            } else {
                // Plain text insertion (default, backward compatible)
                requests = [{
                    insertText: {
                        location: {
                            index: 1
                        },
                        text: content
                    }
                }];
            }

            if (requests.length > 0) {
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
        }

        return context.sendJson({
            documentId: data.documentId,
            title: data.title,
            revisionId: data.revisionId,
            documentUrl: `https://docs.google.com/document/d/${data.documentId}/edit`
        }, 'out');
    }
};
