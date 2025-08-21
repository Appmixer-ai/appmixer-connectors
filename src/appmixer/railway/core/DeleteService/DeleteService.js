'use strict';

module.exports = {
    async receive(context) {

        const { serviceId, environmentId } = context.messages.in.content;

        // Validate required input
        if (!serviceId) {
            throw new context.CancelError('Service ID is required!');
        }

        // GraphQL mutation to delete service
        const mutation = `
            mutation serviceDelete($environmentId: String, $id: String!) {
                serviceDelete(environmentId: $environmentId, id: $id)
            }
        `;

        // https://docs.railway.com/guides/manage-services
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: mutation,
                variables: {
                    id: serviceId,
                    environmentId: environmentId || null
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
