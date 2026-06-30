'use strict';

const { GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const lib = require('../lib');

/**
 * Deletes bucket.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { bucket, key } = context.messages.in.content;
        if (!bucket) {
            throw new context.CancelError('Bucket is required');
        }

        if (!key) {
            throw new context.CancelError('Object Key is required');
        }

        const { s3 } = lib.init(context);
        const params = { Bucket: bucket, Key: key };

        try {
            const metadata = await s3.send(new HeadObjectCommand(params));
            const getObjectResponse = await s3.send(new GetObjectCommand(params));
            // In SDK v3, the Body is a readable stream
            const stream = getObjectResponse.Body;
            const file = await context.saveFileStream(key, stream);
            const object = Object.assign(params, metadata, { FileID: file.fileId });
            return context.sendJson(object, 'object');
        } catch (error) {
            // Re-throw with just the error message. Otherwise a
            // [unable to serialize, circular reference is too complex to analyze]
            // error is thrown.
            throw new Error(error.message);
        }
    }
};
