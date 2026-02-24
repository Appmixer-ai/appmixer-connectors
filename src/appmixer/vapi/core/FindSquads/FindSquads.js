'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Squad ID' },
    'orgId': { 'type': 'string', 'title': 'Organization ID' },
    'name': { 'type': 'string', 'title': 'Squad Name' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' },
    'members': { 'type': 'array', 'title': 'Members' }
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
            params.createdAtGt = new Date(createdAtGt).toISOString();
        }
        if (createdAtLt) {
            params.createdAtLt = new Date(createdAtLt).toISOString();
        }
        if (updatedAtGt) {
            params.updatedAtGt = new Date(updatedAtGt).toISOString();
        }
        if (updatedAtLt) {
            params.updatedAtLt = new Date(updatedAtLt).toISOString();
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
