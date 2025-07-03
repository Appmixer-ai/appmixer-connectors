

'use strict';

module.exports = {
    async receive(context) {

        const { component, metrics, branch, from, to } = context.messages.in.content;
        const url = `${context.auth.serverUrl.replace(/\/$/, '')}/api/measures/search_history`;
        const params = { component, metrics, branch, from, to };
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
