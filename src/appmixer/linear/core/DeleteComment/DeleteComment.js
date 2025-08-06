'use strict';

module.exports = {

    async receive(context) {

        const { commentId } = context.messages.in.content;

        if (!commentId) {
            throw new context.CancelError('commentId is required');
        }

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
                'Authorization': `Bearer ${context.auth.accessToken}`
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

        return context.sendJson({}, 'out');
    }
};
