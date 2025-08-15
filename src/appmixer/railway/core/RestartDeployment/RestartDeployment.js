'use strict';

module.exports = {
    async receive(context) {

        const { deploymentId } = context.messages.in.content;

        // Validate required input
        if (!deploymentId) {
            throw new context.CancelError('Deployment ID is required!');
        }

        // GraphQL mutation to restart deployment
        const mutation = `
            mutation deploymentRestart($id: String!) {
                deploymentRestart(id: $id)
            }
        `;

        // https://docs.railway.com/guides/manage-deployments
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: mutation,
                variables: {
                    id: deploymentId
                }
            }
        });

        // Check for GraphQL errors
        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        // Return empty object for restart operations
        return context.sendJson({}, 'out');
    }
};
