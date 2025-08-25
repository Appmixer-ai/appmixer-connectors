'use strict';

module.exports = {
    async receive(context) {

        const { serviceId, environmentId, commitSha } = context.messages.in.content;

        if (!serviceId) {
            throw new context.CancelError('Service ID is required.');
        }
        if (!environmentId) {
            throw new context.CancelError('Environment ID is required.');
        }

        const mutation = `
            mutation serviceInstanceDeploy($commitSha: String, $environmentId: String!, $latestCommit: Boolean, $serviceId: String!) {
            serviceInstanceDeploy(
                commitSha: $commitSha
                environmentId: $environmentId
                latestCommit: $latestCommit
                serviceId: $serviceId
            )
            }
        `;

        const variables = {
            serviceId: serviceId,
            environmentId: environmentId,
            commitSha: commitSha || null
        };
        const options = {
            method: 'POST',
            url: 'https://backboard.railway.com/graphql/v2',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                query: mutation,
                variables: variables
            }
        };
        const { data } = await context.httpRequest(options);

        if (data.errors) {
            throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
        }

        // serviceInstanceDeploy returns a boolean or deployment ID
        const result = data.data.serviceInstanceDeploy;
        return context.sendJson({ result }, 'out');
    }
};
