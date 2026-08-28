'use strict';

const lib = require('../lib');

// Schema for a single model item.
const schema = {
    id: { type: 'string', title: 'ID' },
    object: { type: 'string', title: 'Object' },
    created: { type: 'integer', title: 'Created' },
    owned_by: { type: 'string', title: 'Owned By' },
    active: { type: 'boolean', title: 'Active' },
    context_window: { type: 'integer', title: 'Context Window' }
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

        // https://console.groq.com/docs/api-reference#models
        const { data } = await lib.request({ context, path: '/models' });

        const items = data?.data ?? [];

        return lib.sendArrayOutput({
            context,
            records: items,
            outputType
        });
    },

    // Used by the model dropdowns of SendPrompt, CreateTranscription and CreateTranslation.
    toSelectArray({ result }) {
        return (result || []).map(model => ({ label: model.id, value: model.id }));
    }
};
