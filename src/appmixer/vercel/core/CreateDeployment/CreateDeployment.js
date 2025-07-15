
'use strict';

module.exports = {
    async receive(context) {

        const { projectId, name, deploymentConfig, teamId } = context.messages.in.content;

        if (!projectId && !name) {
            throw new Error('Either projectId or name is required');
        }

        // Build request body
        const requestBody = {};
        if (projectId) requestBody.projectId = projectId;
        if (name) requestBody.name = name;
        if (deploymentConfig) {
            // Merge deployment configuration
            Object.assign(requestBody, deploymentConfig);
        }

        // Build query parameters
        const params = new URLSearchParams();
        if (teamId) params.append('teamId', teamId);

        const url = `https://api.vercel.com/v13/deployments${params.toString() ? '?' + params.toString() : ''}`;

        // https://vercel.com/docs/rest-api/reference/deployments#create-deployment
        const { data } = await context.httpRequest({
            method: 'POST',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
