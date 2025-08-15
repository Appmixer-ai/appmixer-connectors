'use strict';

module.exports = {
    async receive(context) {

        const { variableName, projectId, serviceId, environmentId } = context.messages.in.content;

        if (!variableName) {
            throw new context.CancelError('Variable name is required.');
        }
        if (!projectId) {
            throw new context.CancelError('Project ID is required.');
        }
        if (!serviceId) {
            throw new context.CancelError('Service ID is required.');
        }
        if (!environmentId) {
            throw new context.CancelError('Environment ID is required.');
        }

        const mutation = `
            mutation variableDelete($input: VariableDeleteInput!) {
                variableDelete(input: $input)
            }
        `;

        const input = {
            name: variableName,
            projectId: projectId,
            serviceId: serviceId,
            environmentId: environmentId
        };

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

        // variableDelete returns a boolean indicating success
        return context.sendJson({}, 'out');
    }
};
