'use strict';

const lib = require('../lib');

// A rewrite between locations or storage classes of a large object takes several calls;
// each call copies part of the data and returns a token for the next one.
const MAX_REWRITE_CALLS = 1000;

module.exports = {

    async receive(context) {

        const { sourceBucket, sourceObject, destinationBucket, destinationObject } = context.messages.in.content;

        if (!sourceBucket) {
            throw new context.CancelError('Source Bucket is required!');
        }
        if (!sourceObject) {
            throw new context.CancelError('Source Object Name is required!');
        }

        const targetBucket = destinationBucket || sourceBucket;
        const targetObject = destinationObject || sourceObject;
        if (targetBucket === sourceBucket && targetObject === sourceObject) {
            throw new context.CancelError('Destination must differ from the source: set Destination Bucket or Destination Object Name.');
        }

        const path = `${lib.objectPath(context, sourceBucket, sourceObject, 'Source Object Name')}/rewriteTo`
            + lib.objectPath(context, targetBucket, targetObject, 'Destination Object Name');

        let rewriteToken;
        for (let call = 0; call < MAX_REWRITE_CALLS; call++) {
            const data = await lib.request(context, {
                method: 'POST',
                path,
                params: rewriteToken ? { rewriteToken } : undefined,
                data: {}
            });
            if (data?.done) {
                return context.sendJson(data.resource, 'out');
            }
            rewriteToken = data?.rewriteToken;
            if (!rewriteToken) {
                throw new Error('Cloud Storage did not finish the copy and returned no rewrite token.');
            }
        }
        throw new Error(`The copy did not finish after ${MAX_REWRITE_CALLS} rewrite calls.`);
    }
};
