'use strict';
const { Upload } = require('@aws-sdk/lib-storage');
const lib = require('../lib');

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

        const { s3 } = lib.init(context);

        // Get file stream from Appmixer storage
        const readStream = await context.getFileReadStream(fileId);

        // Build upload parameters
        const uploadParams = {
            Bucket: bucket,
            Key: key,
            Body: readStream,
            ContentType: contentType,
            Expires: expiryDate ? new Date(expiryDate) : undefined
        };

        // Only add ACL if provided (optional for buckets with ACLs disabled)
        if (acl) {
            uploadParams.ACL = acl;
        }

        // Configure multipart upload options
        const uploadOptions = {
            client: s3,
            params: uploadParams
        };
        if (maxPartSize) {
            uploadOptions.partSize = maxPartSize * 1048576; // Convert MB to bytes
        }
        if (concurrentParts) {
            uploadOptions.queueSize = concurrentParts;
        }

        // Use @aws-sdk/lib-storage Upload class (handles multipart automatically)
        try {
            const upload = new Upload(uploadOptions);
            const result = await upload.done();

            // Return consistent output format
            return context.sendJson({
                Bucket: bucket,
                Key: result.Key,
                ETag: result.ETag,
                Location: result.Location,
                ContentType: contentType,
                Expires: expiryDate
            }, 'object');
        } catch (error) {
            // Re-throw with just the error message. Otherwise a
            // [unable to serialize, circular reference is too complex to analyze]
            // error is thrown.
            throw new Error(error.message || error);
        }
    }
};
