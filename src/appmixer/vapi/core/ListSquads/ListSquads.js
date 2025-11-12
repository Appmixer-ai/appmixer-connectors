'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'ID' },
    'orgId': { 'type': 'string', 'title': 'Organization ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {
    async receive(context) {
        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Squads', value: 'squads' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.vapi.ai/squad',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const squads = Array.isArray(data) ? data : [];

        return lib.sendArrayOutput({ context, records: squads, outputType });
    }
};
