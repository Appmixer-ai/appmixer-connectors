

'use strict';

module.exports = {
    async receive(context) {

        const { metricKeys, projectKeys } = context.messages.in.content;
        const url = `${context.auth.serverUrl.replace(/\/$/, '')}/api/measures/search`;
        const params = { metricKeys, projectKeys };
        const { data } = await context.httpRequest({
            method: 'GET',
            url,
            headers: {
                'Authorization': 'Bearer ' + context.auth.apiKey
            },
            params
        });

        return context.sendJson(data, 'out');
    }
};
