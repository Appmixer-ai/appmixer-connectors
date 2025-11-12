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
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Assistants', value: 'assistants' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.vapi.ai/assistant',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const assistants = Array.isArray(data) ? data : [];

        return lib.sendArrayOutput({ context, records: assistants, outputType });
    }
};
