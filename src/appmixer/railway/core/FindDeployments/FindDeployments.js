'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Deployment Id' },
    'staticUrl': { 'type': 'string', 'title': 'Static URL' }
};

module.exports = {
    async receive(context) {

        const { projectId, serviceId, environmentId, outputType } = context.messages.in.content;

        // Validate that at least one of projectId, serviceId, or environmentId is provided
        if (!projectId && !serviceId && !environmentId) {
            throw new context.CancelError('At least one of Project ID, Service ID, or Environment ID is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Deployments' });
        }

        // Build the GraphQL query based on Railway's API
        const query = `
        query deployments($input: DeploymentListInput!) {
            deployments(
                input: $input
            ) {
                __typename
                edges {
                    node {
                        id
                        staticUrl
                    }
                }
                # pageInfo
            }
        }
        `;

        // Build input object with provided parameters
        const input = {};
        if (projectId) input.projectId = projectId;
        if (serviceId) input.serviceId = serviceId;
        if (environmentId) input.environmentId = environmentId;

        const variables = {
            input: input
        };

        // https://docs.railway.com/guides/manage-deployments
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query,
                variables
            }
        });

        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        const records = data.data.deployments.edges.map(edge => edge.node);

        // If no deployments found, send to notFound port
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
