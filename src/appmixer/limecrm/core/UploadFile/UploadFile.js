'use strict';

const lib = require('../../lib');

/**
 * Content-Disposition of the File API: "inline; filename=<name>". A name with
 * characters outside printable ASCII also gets the RFC 5987 filename* form.
 */
function contentDisposition(fileName) {

    const ascii = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    if (ascii === fileName && !/[\s;,]/.test(fileName)) {
        return 'inline; filename=' + fileName;
    }
    return 'inline; filename="' + ascii + '"; filename*=UTF-8\'\'' + encodeURIComponent(fileName);
}

module.exports = {

    async receive(context) {

        const { fileId, fileName } = context.messages.in.content;

        if (!fileId) {
            throw new context.CancelError('File is required!');
        }

        let fileInfo;
        try {
            fileInfo = await context.getFileInfo(fileId);
        } catch (err) {
            fileInfo = null;
        }
        if (!fileInfo) {
            throw new context.CancelError('File ' + fileId + ' was not found in Appmixer file storage.');
        }

        const name = (fileName && String(fileName).trim()) || fileInfo.filename || 'file';
        const content = await context.loadFile(fileId);

        const data = await lib.apiCall(context, {
            method: 'POST',
            path: '/file/',
            headers: {
                'Content-Disposition': contentDisposition(name),
                'Content-Type': fileInfo.contentType || 'application/octet-stream'
            },
            data: content
        });
        return context.sendJson(lib.mapFile(data), 'out');
    },

    contentDisposition
};
