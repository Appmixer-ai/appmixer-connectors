'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Service Id' },
    'name': { 'type': 'string', 'title': 'Service Name' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {
    async receive(context) {

        const { projectId, outputType } = context.messages.in.content;

        // Validate required input
        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Services' });
        }

        // GraphQL query based on provided sample
        const query = `
            query($id: String!) {
                project(id: $id) {
                    id
                    name
                    services {
                        edges {
                            node {
                                id
                                name
                                createdAt
                                updatedAt
                            }
                        }
                    }
                }
            }
        `;

        // https://docs.railway.com/guides/manage-services
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: query,
                variables: {
                    id: projectId
                }
            }
        });

        // Check for GraphQL errors
        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        // Extract services from the response
        const services = data.data?.project?.services?.edges?.map(edge => edge.node) || [];

        // If no services found, send to notFound port
        if (services.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: services, outputType });
    }
};
