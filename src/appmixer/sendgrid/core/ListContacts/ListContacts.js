'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'email': { 'type': 'string', 'title': 'Email' },
    'first_name': { 'type': 'string', 'title': 'First Name' },
    'last_name': { 'type': 'string', 'title': 'Last Name' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'title': 'Updated At' },
    'custom_fields': { 'type': 'object', 'properties': {}, 'title': 'Custom Fields' },
    'list_ids': { 'type': 'array', 'items': { 'type': 'string' }, 'title': 'List Ids' }
};

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Contacts', value: 'contacts' });
        }

        // https://www.twilio.com/docs/sendgrid/api-reference/contacts/get-all-contacts
        const params = {
            page_size: 500
        };

        if (query) {
            params.query = query;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.sendgrid.com/v3/marketing/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params
        });

        const contacts = data.result || [];

        if (contacts.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: contacts, outputType });
    }
};
