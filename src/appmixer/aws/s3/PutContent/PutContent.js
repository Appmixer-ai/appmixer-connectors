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

        if (!acl) {
            throw new context.CancelError('Access Control is required');
        }


        const { s3 } = commons.init(context);

        const result = await s3.upload({
            Bucket: bucket,
            Key: key,
            Body: content,
            ACL: acl,
            ContentType: contentType,
            Expires: expiryDate,
            ContentEncoding: 'utf8'
        }).promise();

        const object = Object.assign({
            ContentType: contentType,
            Expires: expiryDate,
            Bucket: bucket
        }, result);

        return context.sendJson(object, 'object');
    }
};
