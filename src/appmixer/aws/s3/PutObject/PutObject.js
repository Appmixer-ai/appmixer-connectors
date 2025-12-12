'use strict';
const commons = require('../../aws-commons');

/**
 * Uploads an object.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const {
            bucket,
            key,
            fileId,
            acl,
            contentType,
            expiryDate,
            maxPartSize,
            concurrentParts
        } = context.messages.in.content;

        if (!bucket) {
            throw new context.CancelError('Bucket is required');
        }

        if (!key) {
            throw new context.CancelError('Object Key is required');
        }

        if (!fileId) {
            throw new context.CancelError('File ID is required');
        }

        const { s3 } = commons.init(context);

        // Get file stream from Appmixer storage
        const readStream = await context.getFileReadStream(fileId);

        // Build upload parameters
        const uploadParams = {
            Bucket: bucket,
            Key: key,
            Body: readStream,
            ContentType: contentType,
            Expires: expiryDate
        };

        // Only add ACL if provided (optional for buckets with ACLs disabled)
        if (acl) {
            uploadParams.ACL = acl;
        }

        // Configure multipart upload options
        const uploadOptions = {};
        if (maxPartSize) {
            uploadOptions.partSize = maxPartSize * 1048576; // Convert MB to bytes
        }
        if (concurrentParts) {
            uploadOptions.queueSize = concurrentParts;
        }

        // Use AWS SDK's native upload method (handles multipart automatically)
        const result = await s3.upload(uploadParams, uploadOptions).promise();

        // Return consistent output format
        return context.sendJson({
            Bucket: bucket,
            Key: result.Key,
            ETag: result.ETag,
            Location: result.Location,
            ContentType: contentType,
            Expires: expiryDate
        }, 'object');
    }
};
