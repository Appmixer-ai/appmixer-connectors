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
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

        return context.sendJson({ Bucket: bucket, Key: key }, 'deleted');
    }
};
