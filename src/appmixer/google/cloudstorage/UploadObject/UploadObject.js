'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { bucket, fileId, objectName, contentType } = context.messages.in.content;

        if (!bucket) {
            throw new context.CancelError('Bucket is required!');
        }
        if (!fileId) {
            throw new context.CancelError('File is required!');
        }

        let fileInfo;
        try {
            fileInfo = await context.getFileInfo(fileId);
        } catch (error) {
            throw new context.CancelError('Incorrect File ID. Failed to get file information from the file storage.');
        }

        const name = objectName || fileInfo?.filename;
        if (!name) {
            throw new context.CancelError('Object Name is required!');
        }

        const stream = await context.getFileReadStream(fileId);
        const data = await lib.uploadObject(context, {
            bucket,
            name,
            contentType: contentType || fileInfo?.contentType,
            size: fileInfo?.length,
            stream
        });

        return context.sendJson(data, 'out');
    }
};
