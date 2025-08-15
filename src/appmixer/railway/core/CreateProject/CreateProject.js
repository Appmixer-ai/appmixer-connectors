'use strict';

module.exports = {
    async receive(context) {

        const { name, description, teamId } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Project name is required.');
        }

        const mutation = `
            mutation ProjectCreate($input: ProjectCreateInput!) {
                projectCreate(input: $input) {
                    id
                    name
                    description
                    teamId
                    createdAt
                    updatedAt
                }
            }
        `;

        const variables = {
            input: {
                name: name,
                ...(description && { description: description }),
                ...(teamId && { teamId: teamId })
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

        return context.sendJson(data.data.projectCreate, 'out');
    }
};
