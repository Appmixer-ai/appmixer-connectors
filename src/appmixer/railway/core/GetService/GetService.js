'use strict';

module.exports = {
    async receive(context) {

        const { serviceId } = context.messages.in.content;

        // Validate required input
        if (!serviceId) {
            throw new context.CancelError('Service ID is required!');
        }

        // GraphQL query to get service details by ID
        const query = `
            query($id: String!) {
                service(id: $id) {
                    __typename
                    id
                    name
                    createdAt
                    updatedAt
                    deletedAt
                    projectId
                    templateServiceId
                    templateThreadSlug
                    icon
                    featureFlags
                }
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
                query: query,
                variables: {
                    id: serviceId
                }
            }
        });

        // Check for GraphQL errors
        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        // Return the service data
        return context.sendJson(data.data.service, 'out');
    }
};
