'use strict';
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

module.exports = {

    type: 'apiKey',

    definition: {

        accountNameFromProfileInfo: 'accessKeyId',

        auth: {
            accessKeyId: {
                type: 'text',
                name: 'Access Key Id',
                tooltip: 'Your AWS access key ID'
            },
            secretKey: {
                type: 'text',
                name: 'Secret Key',
                tooltip: 'Your AWS secret access key'
            }
        },

        validate: async context => {

            const s3 = new S3Client({
                credentials: {
                    accessKeyId: context.accessKeyId,
                    secretAccessKey: context.secretKey
                }
            });

            try {
                await s3.send(new ListBucketsCommand({}));
            } catch (err) {
                // If the error is:
                //  User is not authorized to perform: s3:ListAllMyBuckets because no identity-based policy allows the s3:ListAllMyBuckets action
                // we can continue, as the user may not have permissions to list buckets.
                // This permission is not required for most operations.
                if (err.name === 'AccessDenied' && err.message.includes('s3:ListAllMyBuckets')) {
                    return;
                }

                // Otherwise, throw the error.
                throw err;
            }
        }
    }
};
