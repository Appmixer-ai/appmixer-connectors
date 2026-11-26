'use strict';

const pathModule = require('path');
const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (!context.messages.in.content.limeFileId) {
            throw new context.CancelError('File ID is required!');
        }
        const limeFileId = lib.assertId(context, context.messages.in.content.limeFileId, 'File ID');

        const metadata = await lib.apiCall(context, { path: '/file/' + limeFileId + '/' });
        const response = await lib.request(context, {
            path: '/file/' + limeFileId + '/contents/',
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data);
        const fileName = pathModule.basename(String((metadata && metadata.filename) || ('lime-file-' + limeFileId)));
        const savedFile = await context.saveFileStream(fileName, buffer);

        return context.sendJson({
            fileId: savedFile.fileId,
            fileName,
            fileSize: buffer.length,
            contentType: (metadata && metadata.content_type) || (response.headers && response.headers['content-type']) || null,
            limeFileId: Number(limeFileId)
        }, 'out');
    }
};
