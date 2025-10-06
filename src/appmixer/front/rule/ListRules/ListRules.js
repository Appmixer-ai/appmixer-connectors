'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Rules' });
        }

        // https://dev.frontapp.com/reference/list-rules
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api2.frontapp.com/rules',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        const rules = data._results || [];

        return lib.sendArrayOutput({ context, records: rules, outputType });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Rule ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'is_active': { 'type': 'boolean', 'title': 'Is Active' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'title': 'Updated At' },
    'priority': { 'type': 'number', 'title': 'Priority' },
    'conditions': { 'type': 'array', 'title': 'Conditions' },
    'actions': { 'type': 'array', 'title': 'Actions' },
    'owner': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'string', 'title': 'Owner.ID' },
            'email': { 'type': 'string', 'title': 'Owner.Email' },
            'username': { 'type': 'string', 'title': 'Owner.Username' },
            'first_name': { 'type': 'string', 'title': 'Owner.First Name' },
            'last_name': { 'type': 'string', 'title': 'Owner.Last Name' }
        },
        'title': 'Owner'
    }
};
