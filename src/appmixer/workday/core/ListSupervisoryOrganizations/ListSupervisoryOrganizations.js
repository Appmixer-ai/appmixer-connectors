'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'descriptor'],
    properties: {
        id: { type: 'string', title: 'Organization ID', example: '0d2d6a1c8e5c4d6b9a6c5e8f2b1a3c4d' },
        descriptor: { type: 'string', title: 'Name', example: 'Human Resources' },
        href: { type: 'string', title: 'URL', example: 'https://wd2-impl-services1.workday.com/api/common/v1/acme/supervisoryOrganizations/0d2d6a1c8e5c4d6b9a6c5e8f2b1a3c4d' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Organizations', value: 'result' });
        }

        const { data } = await lib.getCollection(context, '/supervisoryOrganizations');
        return lib.sendArrayOutput({ context, records: data, outputType });
    }
};
