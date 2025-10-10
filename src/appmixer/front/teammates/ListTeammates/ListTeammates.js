'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Teammates' });
        }

        // https://dev.frontapp.com/reference/list-teammates
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api2.frontapp.com/teammates',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return lib.sendArrayOutput({ context, records: data._results, outputType });
    }
};

const schema = {
    '_links': {
        'type': 'object',
        'properties': {
            'self': { 'type': 'string', 'title': 'Links.Self' },
            'related': {
                'type': 'object',
                'properties': {
                    'inboxes': { 'type': 'string', 'title': 'Links.Related.Inboxes' },
                    'conversations': { 'type': 'string', 'title': 'Links.Related.Conversations' }
                },
                'title': 'Links.Related'
            }
        },
        'title': 'Links'
    },
    'id': { 'type': 'string', 'title': 'Teammate ID' },
    'email': { 'type': 'string', 'title': 'Email' },
    'username': { 'type': 'string', 'title': 'Username' },
    'first_name': { 'type': 'string', 'title': 'First Name' },
    'last_name': { 'type': 'string', 'title': 'Last Name' },
    'is_admin': { 'type': 'boolean', 'title': 'Is Admin' },
    'is_available': { 'type': 'boolean', 'title': 'Is Available' },
    'is_blocked': { 'type': 'boolean', 'title': 'Is Blocked' },
    'type': { 'type': 'string', 'title': 'Type' },
    'custom_fields': { 'type': 'object', 'title': 'Custom Fields' }
};
