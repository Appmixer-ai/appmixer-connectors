'use strict';

const { ListBucketsCommand } = require('@aws-sdk/client-s3');
const lib = require('../lib');

/**
 * List all buckets.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { sendWholeArray } = context.properties;

        const { s3 } = lib.init(context);
        try {
            const response = await s3.send(new ListBucketsCommand({}));
            const Buckets = response.Buckets || [];

            if (sendWholeArray) {
                return context.sendJson(Buckets, 'bucket');
            } else {
                const promises = [];
                Buckets.forEach(bucket => {
                    promises.push(context.sendJson(bucket, 'bucket'));
                });
                return Promise.all(promises);
            }
        } catch (err) {
            if (sendWholeArray) {
                // When used as a source, return an empty array on error or insufficient permissions.
                return context.sendJson([], 'bucket');
            }

            throw err?.message || err;
        }
    },

    bucketsToSelectArray(buckets) {

        if (buckets && Array.isArray(buckets)) {
            return buckets.map(bucket => ({
                label: bucket.Name,
                value: bucket.Name
            }));
        }
        return [];
    }
};
