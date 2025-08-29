'use strict';

const lib = require('../../lib.generated');
const schema = {
    id: {
        type: 'string',
        title: 'Team Id'
    },
    createdAt: {
        type: 'string',
        title: 'Created At'
    },
    updatedAt: {
        type: 'string',
        title: 'Updated At'
    },
    members: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    title: 'Members.Id'
                },
                role: {
                    type: 'string',
                    title: 'Members.Role'
                }
            }
        },
        title: 'Members'
    }
};

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data.me.teams.edges' });
        }

        // GraphQL query to get user's teams
        const query = `
            query {
                me {
                    teams {
                        edges {
                            node {
                                id
                                createdAt
                                updatedAt
                                members {
                                    id
                                    role
                                }
                                projects {
                                    edges {
                                        node {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: query
            }
        });

        // Check for GraphQL errors
        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        // Extract teams from the response and flatten the structure
        const teams = data.data?.me?.teams?.edges?.map(edge => edge.node) || [];

        return lib.sendArrayOutput({ context, records: teams, outputType });
    }
};
