'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'ID' },
    'orgId': { 'type': 'string', 'title': 'Organization ID' },
    'number': { 'type': 'string', 'title': 'Number' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {
    async receive(context) {
        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Phone Numbers', value: 'phoneNumbers' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.vapi.ai/phone-number',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const phoneNumbers = Array.isArray(data) ? data : [];

        return lib.sendArrayOutput({ context, records: phoneNumbers, outputType });
    }
};
