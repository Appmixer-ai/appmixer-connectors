'use strict';

const lib = require('../../lib');

const schema = {
    'id': {
        'type': 'string',
        'title': 'Model ID'
    },
    'object': {
        'type': 'string',
        'title': 'Object'
    },
    'created': {
        'type': 'number',
        'title': 'Created'
    },
    'owned_by': {
        'type': 'string',
        'title': 'Owned By'
    }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Models' });
        }

        // https://docs.x.ai/docs/api-reference#list-models
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.x.ai/v1/models',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return lib.sendArrayOutput({ context, records: data.data, outputType });
    }
};
