'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'highlight': { 'type': 'string', 'title': 'Highlight' },
    'is_private': { 'type': 'boolean', 'title': 'Is Private' },
    'created_at': { 'type': 'number', 'title': 'Created At' },
    'updated_at': { 'type': 'number', 'title': 'Updated At' }
};

module.exports = {
    async receive(context) {
        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tags', value: 'tags' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api2.frontapp.com/tags',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return lib.sendArrayOutput({ context, records: data._results, outputType });
    }
};
