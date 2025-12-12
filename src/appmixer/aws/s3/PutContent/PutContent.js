'use strict';
const commons = require('../../aws-commons');

/**
 * Puts a UTF8 content in a bucket.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { bucket, key, content, acl, contentType, expiryDate } = context.messages.in.content;
        if (!bucket) {
            throw new context.CancelError('Bucket is required');
        }

        if (!key) {
            throw new context.CancelError('Object Key is required');
        }

        if (!content) {
            throw new context.CancelError('Content is required');
        }

        if (!contentType) {
            throw new context.CancelError('Content Type is required');
        }

        const { s3 } = commons.init(context);

        // Build upload parameters
        const uploadParams = {
            Bucket: bucket,
            Key: key,
            Body: content,
            ContentType: contentType,
            Expires: expiryDate,
            ContentEncoding: 'utf8'
        };

        // Only add ACL if provided (optional for buckets with ACLs disabled)
        if (acl) {
            uploadParams.ACL = acl;
        }

        const result = await s3.upload(uploadParams).promise();

        const object = Object.assign({
            ContentType: contentType,
            Expires: expiryDate,
            Bucket: bucket
        }, result);

        return context.sendJson(object, 'object');
    }
};
