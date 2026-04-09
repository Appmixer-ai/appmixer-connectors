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

        if (headers && Object.keys(headers).length > 0) {
            Object.assign(requestOptions.headers, headers);
        }

        if (parameters && Object.keys(parameters).length > 0) {
            requestOptions.params = parameters;
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
