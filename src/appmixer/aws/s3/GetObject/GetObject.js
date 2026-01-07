'use strict';

const { GetObjectCommand } = require('@aws-sdk/client-s3');
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
            const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
            let bodyBuffer = null;
            if (response.Body) {
                // AWS SDK v3 returns a stream, so we need to read it into a Buffer for backward compatibility
                const chunks = [];
                for await (const chunk of response.Body) {
                    chunks.push(chunk);
                }
                bodyBuffer = Buffer.concat(chunks);
            }
            const object = {
                Bucket: bucket,
                Key: key,
                ...response,
                Body: bodyBuffer ? bodyBuffer.toJSON() : null
            };
            return context.sendJson(object, 'object');
        } catch (error) {
            // Re-throw with just the error message. Otherwise a
            // [unable to serialize, circular reference is too complex to analyze]
            // error is thrown.
            throw new Error(error.message);
        }
    }
};
