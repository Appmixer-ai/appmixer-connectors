'use strict';

module.exports = {
    async receive(context) {

        const { analysisId, branch, projectId, projectKey, pullRequest } = context.messages.in.content;
        const serverUrl = context.auth.serverUrl.replace(/\/$/, '');

        // SonarQube API endpoint: /api/qualitygates/project_status
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${serverUrl}/api/qualitygates/project_status`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params: {
                analysisId,
                branch,
                projectId,
                projectKey,
                pullRequest
            }
        });

        return context.sendJson(data.projectStatus, 'out');
    }
};
