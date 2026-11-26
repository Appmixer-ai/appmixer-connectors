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

        await lib.request(context, { method: 'DELETE', path: lib.objectPath(context, bucket, objectName) });

        return context.sendJson({}, 'out');
    }
};
