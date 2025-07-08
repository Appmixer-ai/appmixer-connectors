'use strict';

/**
 * Component to get the quality gate status of a project or a Compute Engine task.
 * @extends {Component}
 */
module.exports = {
    /**
     * @param {Object} context
     * @param {Object} context.messages
     * @param {Object} context.messages.in
     * @param {Object} context.messages.in.content
     * @param {string} context.messages.in.content.analysisId - Optional analysis identifier
     * @param {string} context.messages.in.content.branch - Optional branch key
     * @param {string} context.messages.in.content.projectId - Optional project UUID (doesn't work with branches/PRs)
     * @param {string} context.messages.in.content.projectKey - Optional project key
     * @param {string} context.messages.in.content.pullRequest - Optional pull request id
     */
    async receive(context) {
        const { analysisId, branch, projectId, projectKey, pullRequest } = context.messages.in.content;
        const serverUrl = context.auth.serverUrl.replace(/\/$/, '');

        // https://sonar.appmixer.cloud/web_api/api/qualitygates/project_status
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

        return context.sendJson(data, 'out');
    }
};
