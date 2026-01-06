'use strict';

const { SNSClient } = require('@aws-sdk/client-sns');

module.exports = {

    init(context) {

        const region = context.messages.in?.content?.region || context.properties.region || 'us-east-1';

        const { accessKeyId, secretKey } = context.auth;
        const credentials = {
            accessKeyId,
            secretAccessKey: secretKey
        };

        const sns = new SNSClient({ region, credentials });

        return {
            sns,
            region
        };
    }
};
