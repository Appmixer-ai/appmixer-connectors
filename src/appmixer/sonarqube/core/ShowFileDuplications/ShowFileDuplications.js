'use strict';

module.exports = {
    async receive(context) {
        const { key } = context.messages.in.content;
        const url = `${context.auth.serverUrl.replace(/\/$/, '')}/api/duplications/show`;
        const headers = {
            'Authorization': 'Bearer ' + context.auth.apiKey
        };
        const params = { key };
        const { data } = await context.httpRequest({
            method: 'GET',
            url,
            headers,
            params
        });
        return context.sendJson(data, 'out');
    }
};
