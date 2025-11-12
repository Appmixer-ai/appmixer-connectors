'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Dataset ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'who': { 'type': 'string', 'title': 'Created By' },
    'created': { 'type': 'string', 'title': 'Created At' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Datasets', value: 'datasets' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.axiom.co/v1/datasets',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        const datasets = Array.isArray(data) ? data : [];

        return lib.sendArrayOutput({ context, records: datasets, outputType });
    }
};
