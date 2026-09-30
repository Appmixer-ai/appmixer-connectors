'use strict';

const lib = require('../lib');

// The output contract of one TypeSafe model record (GET /v1/models,
// https://docs.typesafe.ai/models). The outPort is dynamic (source), so
// component.json declares no schema — exporting it as ITEM_SCHEMA gives the
// offline tooling the same contract the static ports declare.
const ITEM_SCHEMA = {
    type: 'object',
    properties: {
        name: { type: 'string', title: 'Name', example: 'jev-1.13.0' },
        description: {
            type: 'string',
            title: 'Description',
            example: 'System One decision model for choice, score and noul questions.'
        },
        release_date: { type: 'string', title: 'Release Date', example: '2026-09-15' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType = 'array' } = context.messages.in.content || {};

        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(
                context,
                outputType,
                ITEM_SCHEMA.properties,
                { label: 'Models' }
            );
        }

        // `isSource` is set by the Model inputs of the decision components. Opening
        // an inspector fires one call per input, so the source path is cached and
        // its errors are swallowed — the inputs are typeaheads, so an empty list
        // still lets the user type a model name.
        const isSource = Boolean(context.properties && context.properties.isSource);

        let items;
        try {
            const { data } = isSource
                ? await lib.requestCached({ context, path: '/v1/models' })
                : await lib.request({ context, path: '/v1/models' });
            items = Array.isArray(data) ? data : (data?.data ?? []);
        } catch (error) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw error;
        }

        return lib.sendArrayOutput({
            context,
            records: items,
            outputType
        });
    },

    // Used by the Model inputs of Classify Text, Score Text, Verify Statement and Ask Questions.
    toSelectArray({ result }) {

        const models = (result || []).map(model => ({ label: model.name, value: model.name }));
        // The aliases are not necessarily listed by the API but are the recommended values.
        // Reverse order because of unshift: jev-latest ends up first.
        ['jev-preview', 'jev-latest'].forEach(alias => {
            if (!models.some(model => model.value === alias)) {
                models.unshift({ label: alias, value: alias });
            }
        });
        return models;
    }
};
