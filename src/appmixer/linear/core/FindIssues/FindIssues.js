'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'title': { 'type': 'string', 'title': 'Title' },
    'description': { 'type': 'string', 'title': 'Description' },
    'state': { 'type': 'object', 'title': 'State' },
    'assignee': { 'type': 'object', 'title': 'Assignee' },
    'creator': { 'type': 'object', 'title': 'Creator' },
    'team': { 'type': 'object', 'title': 'Team' },
    'labels': { 'type': 'array', 'title': 'Labels' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' },
    'url': { 'type': 'string', 'title': 'URL' }
};

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Issues' });
        }

        // Build GraphQL query for finding issues
        let graphqlQuery = `
            query($filter: IssueFilter) {
                issues(filter: $filter) {
                    nodes {
                        id
                        title
                        description
                        url
                        createdAt
                        updatedAt
                        state {
                            id
                            name
                            color
                        }
                        assignee {
                            id
                            name
                            email
                        }
                        creator {
                            id
                            name
                            email
                        }
                        team {
                            id
                            name
                            key
                        }
                        labels {
                            nodes {
                                id
                                name
                                color
                            }
                        }
                    }
                }
            }
        `;

        const variables = {};
        if (query?.trim()) {
            variables.filter = {
                or: [
                    {
                        title: {
                            containsIgnoreCase: query
                        }
                    },
                    {
                        description: {
                            containsIgnoreCase: query
                        }
                    }
                ]
            };
        }

        // https://linear.app/developers/graphql
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.linear.app/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                query: graphqlQuery,
                variables: variables
            }
        });

        if (data.errors) {
            throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
        }

        const records = data.data.issues.nodes || [];

        // Send to notFound port if no issues are found
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
