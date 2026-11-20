'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'isPublic'],
    properties: {
        id: { type: 'string', title: 'Mailing List ID', example: 'clm2k8j4h6g0f8d6s4a2b0z8' },
        name: { type: 'string', title: 'Name', example: 'Product updates' },
        description: { type: ['string', 'null'], title: 'Description', example: 'Monthly product news and release notes' },
        isPublic: { type: 'boolean', title: 'Public', example: true }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://loops.so/docs/api-reference/list-mailing-lists
    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, {
                label: 'Mailing Lists',
                value: 'result'
            });
        }

        if (isSource) {
            // Inspector dropdown: cached, and never an error popup.
            try {
                const data = await lib.requestCached(context, '/v1/lists');
                return context.sendJson({ result: Array.isArray(data) ? data : [] }, 'out');
            } catch (err) {
                return context.sendJson({ result: [] }, 'out');
            }
        }

        const { data } = await lib.request(context, { path: '/v1/lists' });
        return lib.sendArrayOutput({ context, outputType, records: Array.isArray(data) ? data : [] });
    },

    toSelectArray({ result }) {

        return (result || []).map(list => ({ label: list.name, value: list.id }));
    }
};
