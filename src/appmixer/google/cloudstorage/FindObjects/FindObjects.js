'use strict';

const lib = require('../lib');

const ITEM_SCHEMA = lib.OBJECT_SCHEMA;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { bucket, prefix, matchGlob, startOffset, endOffset, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, {
                label: 'Objects',
                value: 'result'
            });
        }

        if (!bucket) {
            throw new context.CancelError('Bucket is required!');
        }

        const params = { maxResults: lib.PAGE_SIZE };
        if (prefix) {
            params.prefix = prefix;
        }
        if (matchGlob) {
            params.matchGlob = matchGlob;
        }
        if (startOffset) {
            params.startOffset = startOffset;
        }
        if (endOffset) {
            params.endOffset = endOffset;
        }

        const data = await lib.request(context, { path: `${lib.bucketPath(context, bucket)}/o`, params });
        const objects = data?.items || [];

        if (objects.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: objects });
    }
};
