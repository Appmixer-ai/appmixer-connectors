'use strict';

/**
 * Component to get duplications for a file.
 * @extends {Component}
 */
module.exports = {
    /**
     * @param {Object} context
     * @param {Object} context.messages
     * @param {Object} context.messages.in
     * @param {Object} context.messages.in.content
     * @param {string} context.messages.in.content.key - File key
     */
    async receive(context) {
        const { key } = context.messages.in.content;
        const serverUrl = context.auth.serverUrl.replace(/\/$/, '');

        // https://sonar.appmixer.cloud/web_api/api/duplications/show
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${serverUrl}/api/duplications/show`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params: {
                key
            }
        });

        return context.sendJson(data, 'out');
    }
};
