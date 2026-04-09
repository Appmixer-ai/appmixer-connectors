'use strict';

module.exports = {

    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;
        const { domain, apiKey } = context.auth;

        const baseUrl = `https://${domain}.freshdesk.com/api`;
        const fullUrl = baseUrl + url;

        const requestOptions = {
            method,
            url: fullUrl,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            auth: {
                username: apiKey,
                password: 'X'
            }
        };

        if (headers) {
            const parsedHeaders = JSON.parse(headers);
            Object.assign(requestOptions.headers, parsedHeaders);
        }

        if (parameters) {
            requestOptions.params = JSON.parse(parameters);
        }

        if (body) {
            requestOptions.data = JSON.parse(body);
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
