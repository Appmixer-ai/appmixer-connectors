'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'integer', title: 'User (Associate) ID', example: 5 },
        name: { type: 'string', title: 'Name', example: 'Anna Berg' },
        fullName: { type: 'string', title: 'Full Name', example: 'Sales/Anna Berg' },
        tooltip: { type: 'string', title: 'Tooltip', example: 'ANB - Anna Berg' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Items', value: 'result' });
        }

        let records;
        try {
            records = isSource
                ? await lib.callCached(context, { op: 'users' }, () => lib.mdoListItems(context, 'associate'))
                : await lib.mdoListItems(context, 'associate');
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records });
    },

    toSelectArray({ result }) {

        return (result || []).map(item => ({ label: item.name, value: String(item.id) }));
    }
};
