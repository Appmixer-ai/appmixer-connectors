'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Sequences' });
        }

        // https://developers.kit.com/api-reference/sequences/list-sequences
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.kit.com/v4/sequences',
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            params: {
                per_page: 1000
            }
        });

        if (isSource) {
            return context.sendJson({ result: data.sequences }, 'out');
        }

        return lib.sendArrayOutput({ context, records: data.sequences, outputType });
    },

    toSelectArray({ result }) {

        return result.map(sequence => {
            return { label: sequence.name, value: sequence.id };
        });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Sequence ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'hold': { 'type': 'boolean', 'title': 'Hold' },
    'repeat': { 'type': 'boolean', 'title': 'Repeat' },
    'created_at': { 'type': 'string', 'title': 'Created At' }
};
