'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'email': { 'type': 'string', 'title': 'Email' },
    'first_name': { 'type': 'string', 'title': 'First Name' },
    'last_name': { 'type': 'string', 'title': 'Last Name' },
    'custom_fields': { 'type': 'object', 'properties': {}, 'title': 'Custom Fields' }
};

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Contact' });
        }

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        // https://www.twilio.com/docs/sendgrid/api-reference/contacts/search-contacts
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.sendgrid.com/v3/marketing/contacts/search',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                query: query
            }
        });

        const records = response.data.result || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
