'use strict';

const lib = require('../lib');

// Schema for a single model item.
const schema = {
    id: { type: 'string', title: 'ID', example: 'mistral-small-latest' },
    object: { type: 'string', title: 'Object', example: 'model' },
    created: { type: 'integer', title: 'Created', example: 1711430400 },
    owned_by: { type: 'string', title: 'Owned By', example: 'mistralai' }
};

module.exports = {

    async receive(context) {

        const { outputType = 'array' } = context.messages.in.content || {};

        // Generate output port options dynamically if requested.
        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Models' });
        }

        // https://docs.mistral.ai/api/#tag/models
        // Cached: this component also backs the model dropdowns of other components.
        const data = await lib.apiCallCached(context, '/models');
        const items = data?.data ?? [];

        return lib.sendArrayOutput({ context, records: items, outputType });
    },

    // Used by model dropdowns in other components' inspectors.
    toSelectArray({ result }) {
        return (result || []).map(model => ({ label: model.id, value: model.id }));
    }
};
