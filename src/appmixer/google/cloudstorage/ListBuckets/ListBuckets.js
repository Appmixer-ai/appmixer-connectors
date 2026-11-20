'use strict';

const lib = require('../lib');

const ITEM_SCHEMA = lib.BUCKET_SCHEMA;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { projectId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, {
                label: 'Buckets',
                value: 'result'
            });
        }

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        const data = await lib.request(context, {
            path: '/b',
            params: { project: projectId, maxResults: lib.PAGE_SIZE }
        });

        return lib.sendArrayOutput({ context, outputType, records: data?.items || [] });
    }
};
