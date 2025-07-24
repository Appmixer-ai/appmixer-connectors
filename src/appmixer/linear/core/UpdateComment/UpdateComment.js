'use strict';

module.exports = {

    async receive(context) {

        const { commentId, body } = context.messages.in.content;

        if (!commentId) {
            throw new context.CancelError('commentId is required');
        }

        if (!body) {
            throw new context.CancelError('body is required');
        }

        // Build GraphQL mutation for updating a comment
        const graphqlMutation = `
            mutation CommentUpdate($id: String!, $input: CommentUpdateInput!) {
                commentUpdate(id: $id, input: $input) {
                    success
                    comment {
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

        const input = {
            body: body
        };

        // https://linear.app/developers/graphql
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.linear.app/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                query: graphqlMutation,
                variables: { id: commentId, input: input }
            }
        });

        if (data.errors) {
            throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
        }

        if (!data.data.commentUpdate.success) {
            throw new Error('Failed to update comment');
        }

        return context.sendJson({}, 'out');
    }
};
