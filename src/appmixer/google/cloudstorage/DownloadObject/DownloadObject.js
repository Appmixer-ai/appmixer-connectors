'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { bucket, objectName, fileName } = context.messages.in.content;

        if (!bucket) {
            throw new context.CancelError('Bucket is required!');
        }
        if (!objectName) {
            throw new context.CancelError('Object Name is required!');
        }

        const path = lib.objectPath(context, bucket, objectName);
        const object = await lib.request(context, { path });

        const { data: stream } = await context.httpRequest({
            method: 'GET',
            url: `${lib.API_BASE_URL}${path}`,
            params: { alt: 'media', generation: object.generation },
            headers: lib.authHeaders(context),
            responseType: 'stream',
            maxContentLength: Infinity
        });

        // Object names may contain "/" (folders); the file takes the last part.
        const name = fileName || object.name.split('/').filter(Boolean).pop() || object.name;
        const file = await context.saveFileStream(name, stream);

        return context.sendJson({
            fileId: file.fileId,
            fileName: file.filename || name,
            fileSize: file.length,
            contentType: object.contentType,
            object
        }, 'out');
    }
};
