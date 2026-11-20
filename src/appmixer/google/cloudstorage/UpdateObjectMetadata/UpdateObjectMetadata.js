'use strict';

const lib = require('../lib');

const FIELDS = ['contentType', 'cacheControl', 'contentDisposition', 'contentEncoding', 'contentLanguage'];

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const { bucket, objectName, metadata } = input;

        if (!bucket) {
            throw new context.CancelError('Bucket is required!');
        }
        if (!objectName) {
            throw new context.CancelError('Object Name is required!');
        }

        const patch = {};
        for (const field of FIELDS) {
            if (input[field] !== undefined && input[field] !== null && input[field] !== '') {
                patch[field] = input[field];
            }
        }
        const customMetadata = lib.parseCustomMetadata(context, metadata);
        if (customMetadata) {
            patch.metadata = customMetadata;
        }
        if (!Object.keys(patch).length) {
            throw new context.CancelError('Provide at least one property to update.');
        }

        await lib.request(context, {
            method: 'PATCH',
            path: lib.objectPath(context, bucket, objectName),
            data: patch
        });

        return context.sendJson({}, 'out');
    }
};
