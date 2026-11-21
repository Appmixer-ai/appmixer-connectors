'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { documentId, fileName } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        const response = await lib.request(context, {
            path: '/public/v1/documents/' + encodeURIComponent(documentId) + '/download',
            responseType: 'arraybuffer',
            fullResponse: true
        });

        // 202: PandaDoc is still generating the file. A plain error lets the engine retry later.
        if (response.status === 202) {
            throw new Error('PandaDoc is still preparing the PDF of document ' + documentId + '. Try again later.');
        }

        const name = fileName || documentId + '.pdf';
        const contentType = (response.headers && response.headers['content-type']) || 'application/pdf';
        const savedFile = await context.saveFileStream(name, Buffer.from(response.data));

        return context.sendJson({
            fileId: savedFile.fileId,
            fileName: name,
            contentType,
            size: savedFile.length
        }, 'out');
    }
};
