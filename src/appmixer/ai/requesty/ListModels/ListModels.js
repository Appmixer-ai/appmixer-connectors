'use strict';

const lib = require('../lib');

// Schema for a single model item.
const schema = {
    id: { type: 'string', title: 'ID' },
    object: { type: 'string', title: 'Object' },
    created: { type: 'integer', title: 'Created' },
    owned_by: { type: 'string', title: 'Owned By' }
};

module.exports = {

    async receive(context) {

        const { outputType = 'array' } = context.messages.in.content || {};

        // Generate output port options dynamically if requested.
        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(
                context,
                outputType,
                schema,
                { label: 'Models' }
            );
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${lib.getBaseUrl()}/models`,
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });

        const items = data?.data ?? [];

        return lib.sendArrayOutput({
            context,
            records: items,
            outputType
        });
    },

    // Used by Chat Completion / Create Embedding inspector model dropdowns.
    toSelectArray({ result }) {
        return (result || []).map(model => ({ label: model.id, value: model.id }));
    }
};
