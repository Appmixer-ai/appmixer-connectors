'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Project Id' },
    'name': { 'type': 'string', 'title': 'Project Name' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' },
    'teamId': { 'type': 'string', 'title': 'Team ID' }
};

module.exports = {
    async receive(context) {

        const { userId, teamId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Projects' });
        }

        // GraphQL query selection based on input parameters
        let query;
        let variables = {};

        if (teamId) {
            // Case 1: teamId provided - get team projects
            query = `
                query projects($teamId: String!) {
                    projects(teamId: $teamId) {
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
            variables.teamId = teamId;
        } else if (userId) {
            // Case 2: userId provided - get user projects
            query = `
                query projects($userId: String!) {
                    projects(userId: $userId) {
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
            variables.userId = userId;
        } else {
            throw new Error('Either userId or teamId must be provided');
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

        // Extract projects from the response
        const projects = data.data?.projects?.edges?.map(edge => edge.node) || [];

        return lib.sendArrayOutput({ context, records: projects, outputType });
    }
};
