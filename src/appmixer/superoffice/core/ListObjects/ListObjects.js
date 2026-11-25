'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['value', 'label'],
    properties: {
        value: { type: 'string', title: 'Object', example: 'ticket' },
        label: { type: 'string', title: 'Label', example: 'Ticket (request)' },
        resource: { type: 'string', title: 'API Resource', example: 'Ticket' }
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

        // The objects are fixed; no API call.
        const records = lib.OBJECT_OPTIONS.map(option => ({
            ...option,
            resource: lib.ENTITIES[option.value].resource
        }));

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records });
    },

    toSelectArray({ result }) {

        return (result || []).map(item => ({ label: item.label, value: item.value }));
    }
};
