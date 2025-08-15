'use strict';

module.exports = {
    async receive(context) {

        const { projectId } = context.messages.in.content;

        // Validate required input
        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        // GraphQL mutation to delete project
        const mutation = `
            mutation projectDelete($id: String!) {
                projectDelete(id: $id)
            }
        `;

        // https://docs.railway.com/guides/manage-projects
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: mutation,
                variables: {
                    id: projectId
                }
            }
        });

        // Check for GraphQL errors
        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        // Return empty object for delete operations
        return context.sendJson({}, 'out');
    }
};
