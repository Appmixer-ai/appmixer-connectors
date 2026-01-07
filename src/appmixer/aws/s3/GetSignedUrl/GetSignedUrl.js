'use strict';

const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { bucket, key, expires = 86400, operation = 'getObject' } = context.messages.in.content;
        if (!bucket) {
            throw new context.CancelError('Bucket is required');
        }

        if (!key) {
            throw new context.CancelError('Object Key is required');
        }

        const { s3 } = lib.init(context);

        // Choose the appropriate command based on operation
        const Command = operation === 'putObject' ? PutObjectCommand : GetObjectCommand;
        const command = new Command({ Bucket: bucket, Key: key });

        try {
            const url = await getSignedUrl(s3, command, { expiresIn: expires });
            const msg = {
                Bucket: bucket,
                Key: key,
                Expires: expires,
                Url: url
            };
            return context.sendJson(msg, 'url');
        } catch (error) {
            // Re-throw with just the error message. Otherwise a
            // [unable to serialize, circular reference is too complex to analyze]
            // error is thrown.
            throw new Error(error.message);
        }
    }
};
