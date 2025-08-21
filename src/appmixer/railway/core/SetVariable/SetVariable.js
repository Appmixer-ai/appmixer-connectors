'use strict';

module.exports = {
    async receive(context) {

        const { projectId, environmentId, serviceId, variableName, variableValue } = context.messages.in.content;

        // Validate required inputs
        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }
        if (!environmentId) {
            throw new context.CancelError('Environment ID is required!');
        }
        if (!variableName) {
            throw new context.CancelError('Variable Name is required!');
        }
        if (!variableValue) {
            throw new context.CancelError('Variable Value is required!');
        }

        // Build the input object
        const input = {
            projectId: projectId,
            environmentId: environmentId,
            name: variableName,
            value: variableValue
        };

        // Add serviceId if provided (for service-specific variables)
        if (serviceId) {
            input.serviceId = serviceId;
        }

        // GraphQL mutation to upsert variable
        const mutation = `
            mutation variableUpsert($input: VariableUpsertInput!) {
                variableUpsert(input: $input)
            }
        `;

        // https://docs.railway.com/guides/manage-variables
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: mutation,
                variables: {
                    input: input
                }
            }
        });

        // Check for GraphQL errors
        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        // Return empty object for update operations
        return context.sendJson({}, 'out');
    }
};
