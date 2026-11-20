'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'string', title: 'Status ID', example: '2' },
        name: { type: 'string', title: 'Name', example: 'Closed' }
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

        const object = context.messages.in.content.object || context.properties.object;
        if (!object || !lib.RECORD_OBJECTS[object]) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw new context.CancelError('Object must be one of: ' + Object.keys(lib.RECORD_OBJECTS).join(', ') + '.');
        }

        let records;
        try {
            records = isSource
                ? await lib.callCached(context, { op: 'statusValues', object }, () => lib.statusValues(context, object))
                : await lib.statusValues(context, object);
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records });
    },

    toSelectArray({ result }) {

        return (result || []).map(item => ({ label: item.name, value: item.id }));
    }
};
