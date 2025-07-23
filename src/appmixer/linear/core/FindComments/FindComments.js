'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'body': { 'type': 'string', 'title': 'Body' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' },
    'user': { 'type': 'object', 'title': 'User' },
    'issue': { 'type': 'object', 'title': 'Issue' }
};

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Comments' });
        }

        // Build GraphQL query for finding comments
        let graphqlQuery = `
            query($filter: CommentFilter) {
                comments(filter: $filter) {
                    nodes {
                        id
                        body
                        createdAt
                        updatedAt
                        user {
                            id
                            name
                            email
                        }
                        issue {
                            id
                            title
                        }
                    }
                }
            }
        `;

        const variables = {};
        if (query && query.trim()) {
            variables.filter = {
                body: {
                    containsIgnoreCase: query
                }
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

        const records = data.data.comments.nodes || [];

        // Send to notFound port if no comments are found
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
