'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { bucket, objectName } = context.messages.in.content;

        if (!bucket) {
            throw new context.CancelError('Bucket is required!');
        }
        if (!objectName) {
            throw new context.CancelError('Object Name is required!');
        }

        const data = await lib.request(context, { path: lib.objectPath(context, bucket, objectName) });

        return context.sendJson(data, 'out');
    }
};
