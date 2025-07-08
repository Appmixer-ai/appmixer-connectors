'use strict';

/**
 * Component to search for project measures ordered by project names.
 * @extends {Component}
 */
module.exports = {
    /**
     * @param {Object} context
     * @param {Object} context.messages
     * @param {Object} context.messages.in
     * @param {Object} context.messages.in.content
     * @param {string} context.messages.in.content.metricKeys - Comma-separated list of metric keys
     * @param {string} context.messages.in.content.projectKeys - Comma-separated list of project keys
     */
    async receive(context) {
        const { metricKeys, projectKeys } = context.messages.in.content;
        const serverUrl = context.auth.serverUrl.replace(/\/$/, '');

        // https://sonar.appmixer.cloud/web_api/api/measures/search
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${serverUrl}/api/measures/search`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params: {
                metricKeys,
                projectKeys
            }
        });

        return context.sendJson(data, 'out');
    }
};
