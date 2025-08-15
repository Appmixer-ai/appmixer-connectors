'use strict';

module.exports = {
    async receive(context) {

        const { projectId, name } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required.');
        }
        if (!name) {
            throw new context.CancelError('Environment name is required.');
        }

        const mutation = `
            mutation EnvironmentCreate($input: EnvironmentCreateInput!) {
                environmentCreate(input: $input) {
                    id
                    name
                    projectId
                    createdAt
                    updatedAt
                }
            }
        `;

        const variables = {
            input: {
                projectId: projectId,
                name: name
            }
        };

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: mutation,
                variables: variables
            }
        });

        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        return context.sendJson(data.data.environmentCreate, 'out');
    }
};
