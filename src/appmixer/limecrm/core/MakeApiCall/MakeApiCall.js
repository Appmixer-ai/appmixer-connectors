'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint Path is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        // The API key is attached to the request below, so the target is pinned to the
        // API of the connected application.
        const targetUrl = lib.resolveApiUrl(context, url);

        let extraHeaders;
        let params;
        try {
            extraHeaders = lib.kvToObject(headers);
            params = lib.kvToObject(parameters);
        } catch (err) {
            throw new context.CancelError(err.message);
        }

        const requestOptions = {
            method,
            url: lib.withQuery(targetUrl, params),
            headers: {
                ...extraHeaders,
                ...lib.authHeaders(context.auth.apiKey)
            }
        };

        if (body) {
            requestOptions.data = lib.parseJsonInput(context, body, 'Request Body');
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            statusCode: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
