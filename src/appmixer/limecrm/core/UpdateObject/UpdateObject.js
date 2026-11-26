'use strict';

const lib = require('../../lib');

const BASE_INSPECTOR = {
    schema: { properties: { objectId: { type: 'integer' }, values: { type: 'string' } }, required: ['objectId'] },
    inputs: {
        objectId: {
            type: 'number',
            label: 'Object ID',
            index: 1,
            group: 'options',
            tooltip: 'The ID of the object to update.'
        },
        values: {
            type: 'textarea',
            label: 'Values (JSON)',
            index: 2,
            group: 'options',
            tooltip: 'Optional JSON object of property values, e.g. <code>{"phone": "+46 46 123 456", "coworker": null}</code>; <code>null</code> clears a value. Values in the property fields take precedence.'
        }
    },
    groups: { options: { label: 'Options', index: 1 } }
};

module.exports = {

    async receive(context) {

        const { generateInspector } = context.properties;

        if (generateInspector) {
            const properties = await lib.getPropertiesSafe(context, context.properties.limetype);
            return context.sendJson(lib.toInspector(properties, BASE_INSPECTOR, { update: true }), 'out');
        }

        const limetype = lib.assertName(context, context.properties.limetype, 'Limetype');
        const objectId = lib.assertId(context, context.messages.in.content.objectId, 'Object ID');
        const properties = await lib.getPropertiesSafe(context, limetype);
        const values = lib.buildValues(context, context.messages.in.content, properties);
        if (!Object.keys(values).length) {
            throw new context.CancelError('Set at least one property to update, in the property fields or in Values (JSON).');
        }

        // PUT accepts a partial object: only the properties sent are changed.
        await lib.apiCall(context, {
            method: 'PUT',
            path: '/limeobject/' + encodeURIComponent(limetype) + '/' + objectId + '/',
            data: values
        });
        return context.sendJson({}, 'out');
    }
};
