'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { bucket } = context.messages.in.content;

        if (!bucket) {
            throw new context.CancelError('Bucket is required!');
        }

        await lib.request(context, { method: 'DELETE', path: lib.bucketPath(context, bucket) });

        return context.sendJson({}, 'out');
    }
};
