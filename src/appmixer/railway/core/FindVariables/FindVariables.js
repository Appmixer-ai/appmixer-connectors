'use strict';

const lib = require('../../lib.generated');
const schema = {
    'key': { 'type': 'string', 'title': 'Key' },
    'value': { 'type': 'string', 'title': 'Value' }
};

module.exports = {
    async receive(context) {

        const { projectId, environmentId, serviceId, outputType } = context.messages.in.content;

        // Validate required inputs
        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }
        if (!environmentId) {
            throw new context.CancelError('Environment ID is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Variables' });
        }

        // GraphQL query based on provided sample
        const query = `
            query variables(
                $environmentId: String!,
                $projectId: String!,
                $serviceId: String
            ) {
                variables(
                    environmentId: $environmentId,
                    projectId: $projectId,
                    serviceId: $serviceId
                )
            }
        `;

        // Build variables object
        const variables = {
            environmentId: environmentId,
            projectId: projectId
        };
        if (serviceId) {
            variables.serviceId = serviceId;
        }

        // https://docs.railway.com/guides/manage-variables
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: query,
                variables: variables
            }
        });

        // Check for GraphQL errors
        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        // Extract variables from the response
        const variablesList = data.data?.variables || [];

        // If no variables found, send to notFound port
        if (variablesList.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: variablesList, outputType });
    }
};
