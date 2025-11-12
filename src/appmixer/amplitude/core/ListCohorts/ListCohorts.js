'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'size': { 'type': 'number', 'title': 'Size' },
    'project_id': { 'type': 'number', 'title': 'Project Id' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'modified_at': { 'type': 'string', 'title': 'Modified At' },
    'is_system': { 'type': 'boolean', 'title': 'Is System' },
    'owner_id': { 'type': 'number', 'title': 'Owner Id' }
};

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Cohorts', value: 'cohorts' });
        }

        // https://developers.amplitude.com/docs/behavioral-cohorts-api#list-cohorts
        const credentials = `${context.auth.apiKey}:${context.auth.secretKey}`;
        const encoded = Buffer.from(credentials).toString('base64');

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://analytics.eu.amplitude.com/api/3/cohorts',
            headers: {
                'Authorization': `Basic ${encoded}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const cohorts = data.data || [];

        return lib.sendArrayOutput({ context, records: cohorts, outputType });
    }
};
