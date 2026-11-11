'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['key', 'label', 'type'],
    properties: {
        key: { type: 'string', title: 'Key', example: 'favoriteColor' },
        label: { type: 'string', title: 'Label', example: 'Favorite color' },
        type: { type: 'string', title: 'Type', example: 'string' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://loops.so/docs/api-reference/list-contact-properties
    async receive(context) {

        const { list, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, {
                label: 'Contact Properties',
                value: 'result'
            });
        }

        const { data } = await lib.request(context, {
            path: '/v1/contacts/properties',
            params: { list: list === 'custom' ? 'custom' : 'all' }
        });

        return lib.sendArrayOutput({ context, outputType, records: Array.isArray(data) ? data : [] });
    }
};
