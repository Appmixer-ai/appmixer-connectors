'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Task ID' },
    'slug': { 'type': 'string', 'title': 'Task Slug' },
    'filePath': { 'type': 'string', 'title': 'File Path' },
    'exportName': { 'type': 'string', 'title': 'Export Name' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {

    async receive(context) {

        const { projectId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tasks' });
        }

        const baseUrl = context.auth.baseUrl || 'https://cloud.trigger.dev';
        const params = {};

        if (projectId) {
            params.projectId = projectId;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/api/v1/tasks`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params
        });

        const tasks = data.data || [];

        return lib.sendArrayOutput({ context, records: tasks, outputType });
    }
};
