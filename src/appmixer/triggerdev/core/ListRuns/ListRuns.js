'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Run ID' },
    'status': { 'type': 'string', 'title': 'Status' },
    'taskIdentifier': { 'type': 'string', 'title': 'Task Identifier' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' },
    'startedAt': { 'type': 'string', 'title': 'Started At' },
    'completedAt': { 'type': 'string', 'title': 'Completed At' }
};

module.exports = {

    async receive(context) {

        const { status, taskIdentifier, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Runs' });
        }

        const baseUrl = context.auth.baseUrl || 'https://cloud.trigger.dev';
        const params = {};

        if (status) {
            params.status = status;
        }
        if (taskIdentifier) {
            params.taskIdentifier = taskIdentifier;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/api/v1/runs`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params
        });

        const runs = data.data || [];

        return lib.sendArrayOutput({ context, records: runs, outputType });
    }
};
