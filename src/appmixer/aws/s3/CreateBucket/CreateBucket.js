'use strict';

const { CreateBucketCommand, PutBucketVersioningCommand } = require('@aws-sdk/client-s3');
const lib = require('../lib');

/**
 * Creates bucket.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { region } = context.properties;
        const { name, acl, lockEnabled, versionEnabled } = context.messages.in.content;
        if (!name) {
            throw new context.CancelError('Bucket Name is required');
        }

        const { s3 } = lib.init(context);

        const createBucketParams = {
            Bucket: name,
            ACL: acl,
            CreateBucketConfiguration: {
                LocationConstraint: region || 'us-east-1'
            },
            ObjectLockEnabledForBucket: lockEnabled
        };

        try {
            const createResponse = await s3.send(new CreateBucketCommand(createBucketParams));

            await s3.send(new PutBucketVersioningCommand({
                Bucket: name,
                VersioningConfiguration: {
                    Status: versionEnabled ? 'Enabled' : 'Suspended'
                }
            }));

            return context.sendJson({ Name: name, Location: createResponse.Location }, 'bucket');
        } catch (error) {
            // Re-throw with just the error message. Otherwise a
            // [unable to serialize, circular reference is too complex to analyze]
            // error is thrown.
            throw new Error(error.message);
        }
    }
};
