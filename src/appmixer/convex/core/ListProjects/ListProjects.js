'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Project ID' },
    'name': { 'type': 'string', 'title': 'Project Name' },
    'slug': { 'type': 'string', 'title': 'Project Slug' },
    'teamId': { 'type': 'string', 'title': 'Team ID' },
    'createTime': { 'type': 'number', 'title': 'Create Time' }
};

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Projects' });
        }

        // Convex Management API: https://docs.convex.dev/management-api
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.convex.dev/v1/teams/${context.auth.teamId}/list_projects`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const records = data || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
