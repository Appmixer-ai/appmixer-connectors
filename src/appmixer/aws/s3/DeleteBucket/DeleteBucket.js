'use strict';
const { DeleteBucketCommand } = require('@aws-sdk/client-s3');
const lib = require('../lib');

/**
 * Deletes bucket.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { s3 } = lib.init(context);

        const { bucket } = context.messages.in.content;
        if (!bucket) {
            throw new context.CancelError('Bucket is required');
        }

        await s3.send(new DeleteBucketCommand({ Bucket: bucket }));

        return context.sendJson({ Name: bucket }, 'deleted');
    }
};
