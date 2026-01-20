'use strict';

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
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
        try {
            await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
            return context.sendJson({ Bucket: bucket, Key: key }, 'deleted');
        } catch (error) {
            // Re-throw with just the error message. Otherwise a
            // [unable to serialize, circular reference is too complex to analyze]
            // error is thrown.
            throw new Error(error.message);
        }
    }
};
