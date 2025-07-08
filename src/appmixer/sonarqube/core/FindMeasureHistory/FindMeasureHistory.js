'use strict';

/**
 * Component to search measures history of a component.
 * @extends {Component}
 */
module.exports = {
    /**
     * @param {Object} context
     * @param {Object} context.messages
     * @param {Object} context.messages.in
     * @param {Object} context.messages.in.content
     * @param {string} context.messages.in.content.component - Component key
     * @param {string} context.messages.in.content.metrics - Comma-separated list of metric keys
     * @param {string} context.messages.in.content.branch - Optional branch key
     * @param {string} context.messages.in.content.from - Optional start date (inclusive)
     * @param {string} context.messages.in.content.to - Optional end date (inclusive)
     */
    async receive(context) {
        const { component, metrics, branch, from, to } = context.messages.in.content;
        const serverUrl = context.auth.serverUrl.replace(/\/$/, '');

        // https://sonar.appmixer.cloud/web_api/api/measures/search_history
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${serverUrl}/api/measures/search_history`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params: {
                component,
                metrics,
                branch,
                from,
                to
            }
        });

        return context.sendJson(data, 'out');
    }
};
