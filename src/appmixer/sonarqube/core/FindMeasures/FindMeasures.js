

'use strict';

module.exports = {
    async receive(context) {

        const { metricKeys, projectKeys } = context.messages.in.content;
        const url = `${context.serverUrl.replace(/\/$/, '')}/api/measures/search`;
        const headers = {
            'Authorization': 'Basic ' + Buffer.from(context.apiKey + ':').toString('base64')
        };
        const params = {
            metricKeys,
            projectKeys
        };
        const { data } = await context.httpRequest({
            method: 'GET',
            url,
            headers,
            params
        });

        return context.sendJson(data, 'out');
    }
};
