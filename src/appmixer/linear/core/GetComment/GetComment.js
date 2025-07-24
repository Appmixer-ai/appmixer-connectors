'use strict';

module.exports = {
    async receive(context) {

        const { commentId } = context.messages.in.content;

        if (!commentId) {
            throw new context.CancelError('commentId is required');
        }

        // Build GraphQL query for getting a specific comment
        const graphqlQuery = `
            query($id: String!) {
                comment(id: $id) {
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
                variables: { id: commentId }
            }
        });

        if (data.errors) {
            throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
        }

        return context.sendJson(data.data.comment, 'out');
    }
};
