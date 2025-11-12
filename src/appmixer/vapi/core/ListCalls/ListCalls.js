'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'ID' },
    'orgId': { 'type': 'string', 'title': 'Organization ID' },
    'type': { 'type': 'string', 'title': 'Type' },
    'status': { 'type': 'string', 'title': 'Status' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {
    async receive(context) {
        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Calls', value: 'calls' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.vapi.ai/call',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const calls = Array.isArray(data) ? data : [];

        return lib.sendArrayOutput({ context, records: calls, outputType });
    }
};
