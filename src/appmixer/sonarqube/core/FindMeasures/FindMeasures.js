'use strict';

module.exports = {
    async receive(context) {

        const { metricKeys, projectKeys } = context.messages.in.content;
        const serverUrl = context.auth.serverUrl.replace(/\/$/, '');

        if (!metricKeys) {
            throw new context.CancelError('Metric Keys is required');
        }

        if (!projectKeys) {
            throw new context.CancelError('Project Keys is required');
        }

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
