'use strict';

const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

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

            const client = new STSClient({
                region: 'us-east-1',
                credentials: {
                    accessKeyId: context.accessKeyId,
                    secretAccessKey: context.secretKey
                }
            });
            const identity = await client.send(new GetCallerIdentityCommand({}));

            return identity;
        }
    }
};
