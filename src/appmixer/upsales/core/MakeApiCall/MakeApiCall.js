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

        // The API key is attached to every request below, so the target is pinned to the
        // Upsales API origin. An absolute URL on another host would otherwise leak the key.
        const targetUrl = lib.resolveApiUrl(context, url);

        const response = await lib.request(context, {
            method,
            url: targetUrl,
            query: lib.kvToObject(context, parameters),
            headers: lib.kvToObject(context, headers),
            data: body ? lib.parseJsonInput(context, body, 'Request Body') : undefined
        });

        return context.sendJson({
            statusCode: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
