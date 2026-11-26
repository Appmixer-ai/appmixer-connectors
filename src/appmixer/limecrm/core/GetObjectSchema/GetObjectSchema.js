'use strict';

const lib = require('../../lib');

// The output contract of one object when the limetype's properties are not known; the
// variables are generated from the limetype by GetObjectSchema.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'ID', example: 1001 },
        _createdtime: { type: 'string', format: 'date-time', title: 'Created Time', example: '2026-11-16T09:30:00+01:00' },
        _timestamp: { type: 'string', format: 'date-time', title: 'Updated Time', example: '2026-11-16T10:15:00+01:00' }
    }
};

const ORIGINAL_VALUES = {
    originalValues: {
        type: 'object',
        title: 'Original Values',
        example: { phone: '+46 46 123 455' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { limetype, outputType, variant } = context.messages.in.content;
        const properties = await lib.getPropertiesSafe(context, limetype);
        const itemSchema = {
            ...lib.objectSchemaProperties(properties),
            ...(variant === 'updated' ? ORIGINAL_VALUES : {})
        };

        if (outputType) {
            return lib.getOutputPortOptions(context, outputType, itemSchema, { label: 'Objects', value: 'result' });
        }
        return context.sendJson(lib.schemaToOptions(itemSchema), 'out');
    }
};
