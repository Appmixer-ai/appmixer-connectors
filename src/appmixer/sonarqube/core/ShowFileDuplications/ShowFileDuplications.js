

'use strict';

module.exports = {
    async receive(context) {

        const { key } = context.messages.in.content;
        const url = `${context.auth.serverUrl.replace(/\/$/, '')}/api/duplications/show`;
        const params = { key };
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
