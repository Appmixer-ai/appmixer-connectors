'use strict';

const pathModule = require('path');

module.exports = {

    async receive(context) {

        const { documentId, mimeType } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required.');
        }

        if (!mimeType) {
            throw new context.CancelError('MIME Type is required.');
        }

        // Use Google Drive API to export the document
        // https://developers.google.com/drive/api/v3/reference/files/export
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://www.googleapis.com/drive/v3/files/${documentId}/export`,
            params: {
                mimeType: mimeType
            },
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            responseType: 'arraybuffer'
        });

        // Generate filename based on document title and format
        const extensionMap = {
            'application/pdf': 'pdf',
            'text/plain': 'txt',
            'text/html': 'html',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.oasis.opendocument.text': 'odt',
            'application/rtf': 'rtf',
            'application/epub+zip': 'epub'
        };

        const extension = extensionMap[mimeType] || 'pdf';
        let fileName = `document.${extension}`;

        try {
            // Try to get document title for better filename
            const docResponse = await context.httpRequest({
                method: 'GET',
                url: `https://www.googleapis.com/drive/v3/files/${documentId}`,
                params: { fields: 'name' },
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`
                }
            });

            if (docResponse.data.name) {
                fileName = `${docResponse.data.name.replace(/[^a-zA-Z0-9\s-_]/g, '')}.${extension}`;
            }
        } catch (error) {
            // Use default filename if title fetch fails
        }

        // Save file stream and get fileId
        const file = await context.saveFileStream(pathModule.normalize(fileName), Buffer.from(data));

        return context.sendJson({
            fileId: file.fileId,
            fileName: fileName,
            mimeType: mimeType
        }, 'out');
    }
};
