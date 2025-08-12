
'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' },
    'teamId': { 'type': 'string', 'title': 'Team ID' }
};

module.exports = {
    async receive(context) {

        const { userId, teamId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data.projects.edges' });
        }

        // GraphQL query based on provided sample
        const query = `
            query projects($userId: String!) {
                projects(
                    userId: $userId
                ) {
                    edges {
                        node {
                            id
                            name
                            createdAt
                            updatedAt
                            teamId
                        }
                    }
                }
            }
        `;

        // Build variables object
        const variables = {};
        if (userId) variables.userId = userId;
        if (teamId) variables.teamId = teamId;

        // https://docs.railway.com/guides/manage-projects
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

        // Extract projects from the response
        const projects = data.data?.projects?.edges?.map(edge => edge.node) || [];

        return lib.sendArrayOutput({ context, records: projects, outputType });
    }
};
