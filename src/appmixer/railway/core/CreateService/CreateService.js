'use strict';

module.exports = {
    async receive(context) {

        const { projectId, source, name } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required.');
        }
        if (!name) {
            throw new context.CancelError('Service name is required.');
        }

        const mutation = `
            mutation serviceCreate($input: ServiceCreateInput!) {
                serviceCreate(input: $input) {
                    __typename
                    createdAt
                    deletedAt
                    featureFlags
                    icon
                    id
                    name
                    projectId
                    templateServiceId
                    templateThreadSlug
                    updatedAt
                }
            }
        `;

        const input = {
            projectId,
            name
        };

        // Add source if provided
        if (source) {
            const isRepository = source.includes('/') && !source.includes(':') && source.split('/').length === 2;
            input.source = isRepository ? { repo: source } : { image: source };
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: mutation,
                variables: { input }
            }
        });

        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        return context.sendJson(data.data.serviceCreate, 'out');
    }
};
