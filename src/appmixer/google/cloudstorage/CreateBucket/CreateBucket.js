'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { projectId, name, location, storageClass, uniformBucketLevelAccess } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }
        if (!name) {
            throw new context.CancelError('Bucket Name is required!');
        }

        const bucket = { name };
        if (location) {
            bucket.location = location;
        }
        if (storageClass) {
            bucket.storageClass = storageClass;
        }
        if (typeof uniformBucketLevelAccess === 'boolean') {
            bucket.iamConfiguration = { uniformBucketLevelAccess: { enabled: uniformBucketLevelAccess } };
        }

        const data = await lib.request(context, {
            method: 'POST',
            path: '/b',
            params: { project: projectId },
            data: bucket
        });

        return context.sendJson(data, 'out');
    }
};
