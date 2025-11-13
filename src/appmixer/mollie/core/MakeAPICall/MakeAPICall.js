'use strict';

module.exports = {
    async receive(context) {

        const { method, path, query, headers, body } = context.messages.in.content;

        if (!path) {
            throw new context.CancelError('Path is required!');
        }

        if (!method) {
            throw new context.CancelError('Method is required!');
        }

        const requestOptions = {
            method,
            url: `https://api.mollie.com${path}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json',
                ...headers
            }
        };

        if (query && Object.keys(query).length > 0) {
            requestOptions.params = query;
        }

        if (body && Object.keys(body).length > 0) {
            requestOptions.data = body;
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson(response.data, 'out');
    }
};
