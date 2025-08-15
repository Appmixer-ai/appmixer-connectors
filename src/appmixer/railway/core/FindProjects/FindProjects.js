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

        // GraphQL query selection based on input parameters
        let query;
        let variables = {};
        let extractPath;

        if (!userId && !teamId) {
            // Case 1: No userId and no teamId - get authenticated user's projects
            query = `
                query me {
                    me {
                        projects {
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
            extractPath = 'data.me.projects.edges';
        } else {
            // Case 2: userId or teamId (or both) are provided
            query = `
                query projects($teamId: String, $userId: String) {
                    projects(teamId: $teamId, userId: $userId) {
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
            `;

            if (userId) variables.userId = userId;
            if (teamId) variables.teamId = teamId;
            extractPath = 'data.projects.edges';
        }

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

        // Extract projects from the response using the appropriate path
        let projects = [];
        if (extractPath === 'data.me.projects.edges') {
            projects = data.data?.me?.projects?.edges?.map(edge => edge.node) || [];
        } else {
            projects = data.data?.projects?.edges?.map(edge => edge.node) || [];
        }

        // If no projects found, send to notFound port
        if (projects.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: projects, outputType });
    }
};
