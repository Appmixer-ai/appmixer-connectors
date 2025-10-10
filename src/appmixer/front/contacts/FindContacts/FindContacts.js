'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { sortBy, sortOrder, updatedAfter, updatedBefore, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Contacts' });
        }

        const params = {};

        // Convert camelCase to snake_case for API
        if (sortBy) {
            params.sort_by = sortBy;
        }

        if (sortOrder) {
            params.sort_order = sortOrder;
        }

        // Convert datetime to timestamp with up to 3 decimal places
        if (updatedAfter) {
            const afterDate = new Date(updatedAfter);
            params.updated_after = (afterDate.getTime() / 1000).toFixed(3);
        }

        if (updatedBefore) {
            const beforeDate = new Date(updatedBefore);
            params.updated_before = (beforeDate.getTime() / 1000).toFixed(3);
        }

        // https://dev.frontapp.com/reference/list-contacts
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api2.frontapp.com/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const records = data['_results'] || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Contact ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'avatar_url': { 'type': 'string', 'title': 'Avatar URL' },
    'is_spammer': { 'type': 'boolean', 'title': 'Is Spammer' },
    'is_private': { 'type': 'boolean', 'title': 'Is Private' },
    'links': {
        'type': 'array',
        'items': { 'type': 'string' },
        'title': 'Links'
    },
    'handles': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'source': { 'type': 'string', 'title': 'Handles.Source' },
                'handle': { 'type': 'string', 'title': 'Handles.Handle' }
            }
        },
        'title': 'Handles'
    },
    'groups': {
        'type': 'array',
        'title': 'Groups'
    },
    'custom_fields': {
        'type': 'object',
        'title': 'Custom Fields'
    },
    'created_at': { 'type': 'number', 'title': 'Created At' },
    'updated_at': { 'type': 'number', 'title': 'Updated At' },
    '_links': {
        'type': 'object',
        'properties': {
            'self': { 'type': 'string', 'title': 'Links.Self' },
            'related': { 'type': 'object', 'title': 'Links.Related' }
        },
        'title': 'Links'
    }
};
