'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { sortOrder, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tags' });
        }

        const params = {};
        if (sortOrder) {
            params.sort_order = sortOrder;
        }

        // https://dev.frontapp.com/reference/list-tags
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api2.frontapp.com/tags',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        return lib.sendArrayOutput({ context, records: data['_results'], outputType });
    }
};

const schema = {
    '_links': {
        'type': 'object',
        'properties': {
            'self': { 'type': 'string', 'title': 'Self Link' },
            'related': {
                'type': 'object',
                'properties': {
                    'conversations': { 'type': 'string', 'title': 'Conversations Link' },
                    'owner': { 'type': 'string', 'title': 'Owner Link' },
                    'parent_tag': { 'type': 'string', 'title': 'Parent Tag Link' },
                    'children': { 'type': 'string', 'title': 'Children Link' }
                },
                'title': 'Related Links'
            }
        },
        'title': 'Links'
    },
    'id': { 'type': 'string', 'title': 'Tag ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'highlight': { 'type': 'string', 'title': 'Highlight' },
    'description': { 'type': 'string', 'title': 'Description' },
    'is_private': { 'type': 'boolean', 'title': 'Is Private' },
    'is_visible_in_conversation_lists': { 'type': 'boolean', 'title': 'Is Visible In Conversation Lists' },
    'updated_at': { 'type': 'number', 'title': 'Updated At' },
    'created_at': { 'type': 'number', 'title': 'Created At' }
};
