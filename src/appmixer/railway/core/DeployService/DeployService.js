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
            mutation serviceInstanceDeployV2($commitSha: String, $environmentId: String!, $serviceId: String!) {
                serviceInstanceDeployV2(
                    commitSha: $commitSha
                    environmentId: $environmentId
                    serviceId: $serviceId
                )
            }
        `;

        const variables = {
            serviceId: serviceId,
            environmentId: environmentId,
            commitSha: commitSha || null
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

        // serviceInstanceDeployV2 returns a boolean or deployment ID
        const result = data.data.serviceInstanceDeployV2;
        return context.sendJson({ result }, 'out');
    }
};
