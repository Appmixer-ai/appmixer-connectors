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

        try {
            await s3.send(new DeleteBucketCommand({ Bucket: bucket }));

            return context.sendJson({ Name: bucket }, 'deleted');
        } catch (error) {
            // Re-throw with just the error message. Otherwise a
            // [unable to serialize, circular reference is too complex to analyze]
            // error is thrown.
            throw new Error(error.message);
        }
    }
};
