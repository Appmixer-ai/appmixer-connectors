

'use strict';

module.exports = {
    async receive(context) {

        const { key } = context.messages.in.content;
        const url = `${context.serverUrl.replace(/\/$/, '')}/api/duplications/show`;
        const headers = {
            'Authorization': 'Basic ' + Buffer.from(context.apiKey + ':').toString('base64')
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
