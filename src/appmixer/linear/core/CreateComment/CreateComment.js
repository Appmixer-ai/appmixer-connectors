'use strict';

module.exports = {
    async receive(context) {

        const { issueId, body } = context.messages.in.content;

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
            issueId: issueId,
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
                variables: { input: input }
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
