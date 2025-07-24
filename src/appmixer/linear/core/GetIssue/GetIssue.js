'use strict';

module.exports = {
    async receive(context) {

        const { issueId } = context.messages.in.content;

        if (!issueId) {
            throw new context.CancelError('issueId is required');
        }

        // Build GraphQL query for getting a specific issue
        const graphqlQuery = `
            query($id: String!) {
                issue(id: $id) {
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
        `;

        // https://linear.app/developers/graphql
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.linear.app/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                query: graphqlQuery,
                variables: { id: issueId }
            }
        });

        if (data.errors) {
            throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
        }

        return context.sendJson(data.data.issue, 'out');
    }
};
