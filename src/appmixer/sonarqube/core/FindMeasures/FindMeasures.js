'use strict';

module.exports = {
    async receive(context) {
        const { metricKeys, projectKeys } = context.messages.in.content;
        const url = `${context.auth.serverUrl.replace(/\/$/, '')}/api/measures/search`;
        const headers = {
            'Authorization': 'Bearer ' + context.auth.apiKey
        };
        const params = { metricKeys, projectKeys };
        const { data } = await context.httpRequest({
            method: 'GET',
            url,
            headers,
            params
        });
        return context.sendJson(data, 'out');
    }
};
