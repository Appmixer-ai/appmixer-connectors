

'use strict';

module.exports = {
    async receive(context) {

        const { component, metrics, branch, from, to } = context.messages.in.content;
        const url = `${context.serverUrl.replace(/\/$/, '')}/api/measures/search_history`;
        const headers = {
            'Authorization': 'Basic ' + Buffer.from(context.apiKey + ':').toString('base64')
        };
        const params = { component, metrics, branch, from, to };
        const { data } = await context.httpRequest({
            method: 'GET',
            url,
            headers,
            params
        });

        return context.sendJson(data, 'out');
    }
};
