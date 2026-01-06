'use strict';
const { ListBucketsCommand } = require('@aws-sdk/client-s3');
const { init, processItems } = require('../../aws-commons');

/**
 * Component which triggers whenever new bucket is created.
 * @extends {Component}
 */
module.exports = {

    async tick(context) {

        const { s3 } = init(context);
        const response = await s3.send(new ListBucketsCommand({}));
        const Buckets = response.Buckets || [];

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
