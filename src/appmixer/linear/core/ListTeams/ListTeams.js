'use strict';

const lib = require('../../lib.generated');

const schema = {
    'id': { 'type': 'string', 'title': 'Team Id' },
    'name': { 'type': 'string', 'title': 'Team Name' },
    'key': { 'type': 'string', 'title': 'Team Key' },
    'description': { 'type': 'string', 'title': 'Team Description' },
    'icon': { 'type': 'string', 'title': 'Team Icon' },
    'color': { 'type': 'string', 'title': 'Team Color' },
    'createdAt': { 'type': 'string', 'title': 'Team Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Team Updated At' }
};

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Teams' });
        }

        // Build GraphQL query for listing teams
        const graphqlQuery = `
            query {
                teams {
                    nodes {
                        id
                        name
                        key
                        description
                        icon
                        color
                        createdAt
                        updatedAt
                    }
                }
            }
        `;

        // https://linear.app/developers/graphql
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.linear.app/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                query: graphqlQuery
            }
        });

        if (data.errors) {
            throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
        }

        const teams = data.data.teams.nodes || [];

        return lib.sendArrayOutput({ context, records: teams, outputType });
    }
};
