'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Deployment ID' },
    'version': { 'type': 'string', 'title': 'Version' },
    'status': { 'type': 'string', 'title': 'Status' },
    'environmentId': { 'type': 'string', 'title': 'Environment ID' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {

    async receive(context) {

        const { environmentId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Deployments' });
        }

        const baseUrl = context.auth.baseUrl || 'https://cloud.trigger.dev';
        const params = {};

        if (environmentId) {
            params.environmentId = environmentId;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/api/v1/deployments`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params
        });

        const deployments = data.data || [];

        return lib.sendArrayOutput({ context, records: deployments, outputType });
    }
};
