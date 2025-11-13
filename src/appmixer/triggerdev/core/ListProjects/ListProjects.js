'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Project ID' },
    'name': { 'type': 'string', 'title': 'Project Name' },
    'slug': { 'type': 'string', 'title': 'Project Slug' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Projects' });
        }

        const baseUrl = context.auth.baseUrl || 'https://cloud.trigger.dev';

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/api/v1/projects`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const projects = data.data || [];

        return lib.sendArrayOutput({ context, records: projects, outputType });
    }
};
