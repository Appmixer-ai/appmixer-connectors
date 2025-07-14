'use strict';

module.exports = {
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
