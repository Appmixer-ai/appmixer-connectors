'use strict';
const { ListBucketsCommand } = require('@aws-sdk/client-s3');
const { init } = require('../lib');

function processBuckets(buckets, deletedBuckets, bucket) {

    const found = buckets.find(({ Name }) => Name === bucket.Name);
    if (!found) {
        deletedBuckets.add(bucket);
    }
}

/**
 * Component which triggers whenever bucket is deleted.
 * @extends {Component}
 */
module.exports = {

    async tick(context) {
        const { s3, region } = init(context);
        let Buckets;
        try {
            const response = await s3.send(new ListBucketsCommand({ BucketRegion: region }));
            Buckets = response.Buckets || [];
        } catch (error) {
            // Re-throw with just the error message. Otherwise a
            // [unable to serialize, circular reference is too complex to analyze]
            // error is thrown.
            throw new Error(error.message);
        }

        const { buckets } = context.state;
        let diff = new Set();
        if (Array.isArray(buckets)) {
            buckets.forEach(processBuckets.bind(null, Buckets, diff));
        }

        if (diff.size) {
            const promises = [];
            diff.forEach(bucket => {
                promises.push(context.sendJson(bucket, 'deleted'));
            });
            await Promise.all(promises);
        }

        return context.saveState({ buckets: Buckets });
    }
};
