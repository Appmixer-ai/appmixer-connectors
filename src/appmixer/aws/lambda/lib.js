'use strict';

const { LambdaClient } = require('@aws-sdk/client-lambda');

module.exports = {

    init(context) {

        const region = context.messages.in?.content?.region || context.properties.region || 'us-east-1';

        const { accessKeyId, secretKey } = context.auth;
        const credentials = {
            accessKeyId,
            secretAccessKey: secretKey
        };

        const lambda = new LambdaClient({ region, credentials });

        return {
            lambda,
            region
        };
    }
};
