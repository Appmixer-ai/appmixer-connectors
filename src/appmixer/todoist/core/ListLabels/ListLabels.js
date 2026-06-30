'use strict';

const lib = require('../../lib');

const labelSchema = {
    'id': { 'type': 'string', 'title': 'ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'color': { 'type': 'string', 'title': 'Color' },
    'order': { 'type': 'integer', 'title': 'Order' },
    'is_favorite': { 'type': 'boolean', 'title': 'Is Favorite' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        // Handle dynamic output port options generation
        if (context.properties.generateOutputPortOptions) {
            return context.sendJson(
                lib.getOutputPortSchema(labelSchema, outputType || 'array', 'Labels'),
                'out'
            );
        }

        const labels = await lib.apiRequest(context, '/labels');

        return lib.sendArrayOutput({
            context,
            outputType: outputType || 'array',
            records: labels
        });
    }
};
