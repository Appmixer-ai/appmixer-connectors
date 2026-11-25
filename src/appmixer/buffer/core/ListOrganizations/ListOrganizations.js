'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'string', title: 'Organization ID', example: '5e7a1b2c3d4e5f6a7b8c9d0e' },
        name: { type: 'string', title: 'Name', example: 'My Company' },
        ownerEmail: { type: 'string', title: 'Owner Email', example: 'owner@example.com' },
        channelCount: { type: 'integer', title: 'Channel Count', example: 3 }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Organizations', value: 'result' });
        }

        let organizations;
        try {
            organizations = isSource
                ? await lib.callCached(context, { op: 'organizations' }, () => lib.listOrganizations(context))
                : await lib.listOrganizations(context);
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records: organizations });
    },

    toSelectArray({ result }) {

        return (result || []).map(org => ({ label: org.name || org.id, value: org.id }));
    }
};
