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

        // The bearer token is attached to the request, so the target is pinned to the
        // Harvest API origin. An absolute URL on another host would leak the token.
        const targetUrl = lib.resolveApiUrl(context, url);

        const params = lib.kvToObject(parameters);
        const response = await lib.apiRequest(context, {
            method,
            url: targetUrl,
            headers: lib.kvToObject(headers),
            params,
            data: body ? lib.parseJsonInput(context, body, 'Request Body') : undefined
        });

        return context.sendJson({
            statusCode: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
