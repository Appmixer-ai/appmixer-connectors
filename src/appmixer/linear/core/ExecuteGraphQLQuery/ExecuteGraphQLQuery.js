'use strict';

module.exports = {
    async receive(context) {

        const { query, variables } = context.messages.in.content;

        if (!query) {
            throw new context.CancelError('GraphQL query is required');
        }

        // Parse variables if they are provided as a string
        let parsedVariables = {};
        if (variables) {
            if (typeof variables === 'string') {
                try {
                    parsedVariables = JSON.parse(variables);
                } catch (error) {
                    throw new context.CancelError('Invalid JSON format for variables: ' + error.message);
                }
            } else {
                parsedVariables = variables;
            }
        }

        // https://linear.app/developers/graphql
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.linear.app/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                query: query,
                variables: parsedVariables
            }
        });

        if (data.errors) {
            throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
        }

        return context.sendJson({ data: data.data }, 'out');
    }
};
