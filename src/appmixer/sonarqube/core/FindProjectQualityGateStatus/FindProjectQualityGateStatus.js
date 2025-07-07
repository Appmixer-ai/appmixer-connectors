'use strict';

module.exports = {
    async receive(context) {

        const { analysisId, branch, projectId, projectKey, pullRequest } = context.messages.in.content;
        const url = `${context.auth.serverUrl.replace(/\/$/, '')}/api/qualitygates/project_status`;
        const headers = {
            'Authorization': 'Bearer ' + context.auth.apiKey
        };
        const params = { analysisId, branch, projectId, projectKey, pullRequest };
        const { data } = await context.httpRequest({
            method: 'GET',
            url,
            headers,
            params
        });

        return context.sendJson(data.projectStatus, 'out');
    }
};
