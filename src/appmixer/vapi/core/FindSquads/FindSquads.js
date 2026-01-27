'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'members': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'id': { 'type': 'string', 'title': 'Members.Id' },
                'name': { 'type': 'string', 'title': 'Members.Name' },
                'email': { 'type': 'string', 'title': 'Members.Email' },
                'role': { 'type': 'string', 'title': 'Members.Role' }
            },
            'required': ['id', 'name', 'email', 'role']
        },
        'title': 'Members'
    },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' },
    'status': { 'type': 'string', 'title': 'Status' }
};

module.exports = {
    async receive(context) {

        const { createdAtGt, createdAtLt, updatedAtGt, updatedAtLt, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Squads', value: 'squads' });
        }

        // https://docs.vapi.ai/api-reference/squads/list
        const params = {};

        if (createdAtGt) {
            params.createdAtGt = createdAtGt;
        }
        if (createdAtLt) {
            params.createdAtLt = createdAtLt;
        }
        if (updatedAtGt) {
            params.updatedAtGt = updatedAtGt;
        }
        if (updatedAtLt) {
            params.updatedAtLt = updatedAtLt;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.vapi.ai/squad',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params
        });

        const squads = Array.isArray(data) ? data : [];

        if (squads.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: squads, outputType });
    }
};
