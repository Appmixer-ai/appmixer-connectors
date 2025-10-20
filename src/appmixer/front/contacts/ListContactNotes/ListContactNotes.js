'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { contactId, outputType } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required.');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Notes', value: 'notes' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/contacts/${contactId}/notes`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        const records = data['_results'] || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};

const schema = {
    '_links': {
        'type': 'object',
        'properties': {
            'related': {
                'type': 'object',
                'properties': {
                    'author': { 'type': 'string', 'title': 'Links.Related.Author' },
                    'owner': { 'type': ['string', 'null'], 'title': 'Links.Related.Owner' }
                },
                'title': 'Links.Related'
            }
        },
        'title': 'Links'
    },
    'author': {
        'type': 'object',
        'properties': {
            '_links': {
                'type': 'object',
                'properties': {
                    'self': { 'type': 'string', 'title': 'Author.Links.Self' },
                    'related': {
                        'type': 'object',
                        'properties': {
                            'inboxes': { 'type': 'string', 'title': 'Author.Links.Related.Inboxes' },
                            'conversations': { 'type': 'string', 'title': 'Author.Links.Related.Conversations' }
                        },
                        'title': 'Author.Links.Related'
                    }
                },
                'title': 'Author.Links'
            },
            'id': { 'type': 'string', 'title': 'Author.Id' },
            'email': { 'type': 'string', 'title': 'Author.Email' },
            'username': { 'type': 'string', 'title': 'Author.Username' },
            'first_name': { 'type': 'string', 'title': 'Author.First Name' },
            'last_name': { 'type': 'string', 'title': 'Author.Last Name' },
            'is_admin': { 'type': 'boolean', 'title': 'Author.Is Admin' },
            'is_available': { 'type': 'boolean', 'title': 'Author.Is Available' },
            'is_blocked': { 'type': 'boolean', 'title': 'Author.Is Blocked' },
            'type': { 'type': 'string', 'title': 'Author.Type' },
            'custom_fields': { 'type': 'object', 'title': 'Author.Custom Fields' }
        },
        'title': 'Author'
    },
    'body': { 'type': 'string', 'title': 'Body' },
    'is_private': { 'type': 'boolean', 'title': 'Is Private' },
    'created_at': { 'type': 'number', 'title': 'Created At' }
};
