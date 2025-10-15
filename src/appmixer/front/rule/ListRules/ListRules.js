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

        const rules = data['_results'] || [];

        return lib.sendArrayOutput({ context, records: rules, outputType });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Rule ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'actions': {
        'type': 'array',
        'items': { 'type': 'string' },
        'title': 'Actions'
    },
    'is_private': { 'type': 'boolean', 'title': 'Is Private' },
    '_links': {
        'type': 'object',
        'properties': {
            'self': { 'type': 'string', 'title': 'Links.Self' },
            'related': {
                'type': 'object',
                'properties': {
                    'owner': { 'type': ['string', 'null'], 'title': 'Links.Related.Owner' }
                },
                'title': 'Links.Related'
            }
        },
        'title': 'Links'
    }
};
