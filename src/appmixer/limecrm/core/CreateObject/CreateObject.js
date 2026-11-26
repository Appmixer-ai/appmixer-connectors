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

const BASE_INSPECTOR = {
    schema: { properties: { values: { type: 'string' } }, required: [] },
    inputs: {
        values: {
            type: 'textarea',
            label: 'Values (JSON)',
            index: 1,
            group: 'options',
            tooltip: 'Optional JSON object of property values, e.g. <code>{"name": "Acme Inc."}</code>. Values in the property fields take precedence.'
        }
    },
    groups: { options: { label: 'Options', index: 1 } }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { generateInspector } = context.properties;

        if (generateInspector) {
            const properties = await lib.getPropertiesSafe(context, context.properties.limetype);
            return context.sendJson(lib.toInspector(properties, BASE_INSPECTOR), 'out');
        }

        const limetype = lib.assertName(context, context.properties.limetype, 'Limetype');
        const properties = await lib.getPropertiesSafe(context, limetype);
        const values = lib.buildValues(context, context.messages.in.content, properties);
        if (!Object.keys(values).length) {
            throw new context.CancelError('Set at least one property, in the property fields or in Values (JSON).');
        }

        const data = await lib.apiCall(context, {
            method: 'POST',
            path: '/limeobject/' + encodeURIComponent(limetype) + '/',
            data: values
        });
        return context.sendJson(lib.mapObject(data), 'out');
    }
};
