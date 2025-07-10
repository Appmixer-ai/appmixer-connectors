'use strict';

const lib = require('../../lib.generated');

module.exports = {
    async receive(context) {

        const { commentId } = context.messages.in.content;

        // Build GraphQL mutation for deleting a comment
        const graphqlMutation = `
            mutation CommentDelete($id: String!) {
                commentDelete(id: $id) {
                    success
                }
            }
        `;

        // https://linear.app/developers/graphql
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.linear.app/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                query: graphqlMutation,
                variables: { id: commentId }
            }
        });

        if (data.errors) {
            throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
        }

        if (!data.data.commentDelete.success) {
            throw new Error('Failed to delete comment');
        }

        return context.sendJson({ success: true, deletedCommentId: commentId }, 'out');
    }
};
