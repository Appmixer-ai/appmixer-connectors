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

        // The account's token is attached to the request below, so the target is pinned to the
        // Nuki API origin. An absolute URL pointing at another host is refused.
        const targetUrl = lib.resolveApiUrl(context, url);

        // The Authorization header always comes from the connected account, whatever its spelling
        // in the user's headers.
        const customHeaders = lib.kvToObject(context, headers, 'Request Headers');
        for (const key of Object.keys(customHeaders)) {
            if (key.toLowerCase() === 'authorization') {
                delete customHeaders[key];
            }
        }

        const requestOptions = {
            method,
            url: targetUrl,
            headers: {
                ...customHeaders,
                ...lib.authHeaders(context)
            }
        };

        const params = lib.kvToObject(context, parameters, 'Query Parameters');
        if (Object.keys(params).length > 0) {
            requestOptions.params = params;
        }

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
