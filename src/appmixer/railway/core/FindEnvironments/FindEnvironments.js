'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Environment Id' },
    'name': { 'type': 'string', 'title': 'Environment Name' }
};

module.exports = {
    async receive(context) {

        const { projectId, outputType } = context.messages.in.content;

        // Validate required input
        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Environments' });
        }

        // GraphQL query based on Postman example
        const query = `
            query environments($projectId: String!) {
                project(id: $projectId) {
                    environments {
                        edges {
                            node {
                                id
                                name
                            }
                        }
                    }
                }
            }
        `;

        // https://docs.railway.com/guides/manage-projects
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: query,
                variables: {
                    projectId: projectId
                }
            }
        });

        // Check for GraphQL errors
        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        // Extract environments from the response
        const environments = data.data?.project?.environments?.edges?.map(edge => edge.node) || [];

        // If no environments found, send to notFound port
        if (environments.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: environments, outputType });
    }
};
