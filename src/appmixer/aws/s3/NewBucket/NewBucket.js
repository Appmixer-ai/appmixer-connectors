'use strict';

const { ListBucketsCommand } = require('@aws-sdk/client-s3');
const { init, processItems } = require('../lib');

/**
 * Component which triggers whenever new bucket is created.
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

        let known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        let actual = new Set();
        let diff = new Set();

        if (Array.isArray(Buckets)) {
            Buckets.forEach(processItems.bind(null, known, actual, diff, 'Name'));
        }
        await context.saveState({ known: Array.from(actual) });

        if (diff.size) {
            const promises = [];
            diff.forEach(bucket => {
                promises.push(context.sendJson(bucket, 'bucket'));
            });
            return Promise.all(promises);
        }
    }
};
