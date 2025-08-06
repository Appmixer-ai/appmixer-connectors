'use strict';

module.exports = {
    async receive(context) {

        const { issueId, body } = context.messages.in.content;

        if (!issueId) {
            throw new context.CancelError('Issue ID is required');
        }
        if (!body) {
            throw new context.CancelError('Comment body is required');
        }

        // Build GraphQL mutation for creating a comment
        const graphqlMutation = `
            mutation CommentCreate($input: CommentCreateInput!) {
                commentCreate(input: $input) {
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
            issueId,
            body
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
                variables: { input }
            }
        });

        if (data.errors) {
            throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
        }

        if (!data.data.commentCreate.success) {
            throw new Error('Failed to create comment');
        }

        return context.sendJson(data.data.commentCreate.comment, 'out');
    }
};
