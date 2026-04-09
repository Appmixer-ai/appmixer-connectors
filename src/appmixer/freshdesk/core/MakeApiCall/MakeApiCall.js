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

        if (headers && headers.length > 0) {
            headers.forEach(({ key, value }) => {
                if (key) requestOptions.headers[key] = value;
            });
        }

        if (parameters && parameters.length > 0) {
            requestOptions.params = parameters.reduce((acc, { key, value }) => {
                if (key) acc[key] = value;
                return acc;
            }, {});
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
