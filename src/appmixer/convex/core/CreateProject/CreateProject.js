'use strict';

module.exports = {
    async receive(context) {

        const { projectName, deploymentType } = context.messages.in.content;

        if (!projectName) {
            throw new context.CancelError('Project Name is required!');
        }

        // https://docs.convex.dev/management-api
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.convex.dev/v1/teams/${context.auth.teamId}/create_project`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                projectName: projectName,
                deploymentType: deploymentType || 'dev'
            }
        });

        return context.sendJson(data, 'out');
    }
};
