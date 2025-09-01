'use strict';

module.exports = {

    async receive(context) {

        const { issueId } = context.messages.in.content;

        if (!issueId) {
            throw new context.CancelError('issueId is required');
        }

        // Build GraphQL mutation for deleting an issue
        const graphqlMutation = `
            mutation IssueDelete($id: String!) {
                issueDelete(id: $id) {
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
                variables: { id: issueId }
            }
        });

        if (data.errors) {
            throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
        }

        if (!data.data.issueDelete.success) {
            throw new Error('Failed to delete issue');
        }

        return context.sendJson({}, 'out');
    }
};
