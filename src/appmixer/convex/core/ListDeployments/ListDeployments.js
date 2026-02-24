'use strict';

const lib = require('../../lib');

const schema = {
    'name': { 'type': 'string', 'title': 'Deployment Name' },
    'projectId': { 'type': 'number', 'title': 'Project ID' },
    'teamId': { 'type': 'number', 'title': 'Team ID' },
    'deploymentType': { 'type': 'string', 'title': 'Deployment Type' },
    'createTime': { 'type': 'number', 'title': 'Create Time' }
};

module.exports = {
    async receive(context) {

        const { projectId, outputType } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Deployments' });
        }

        // Convex Management API: https://docs.convex.dev/management-api
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.convex.dev/v1/projects/${projectId}/list_deployments`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const records = data || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
