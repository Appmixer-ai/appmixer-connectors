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

        // The account's credential is attached to every request below, so the target is pinned to
        // the account's own Gorgias host. An absolute URL on any other host is rejected.
        const targetUrl = lib.resolveApiUrl(context, url);

        const requestOptions = {
            method,
            url: targetUrl,
            headers: lib.kvToObject(headers)
        };

        const params = lib.kvToObject(parameters);
        if (Object.keys(params).length > 0) {
            requestOptions.params = params;
        }

        if (body && method !== 'GET') {
            requestOptions.data = lib.parseJsonInput(context, body, 'Request Body');
        }

        const response = await lib.request(context, requestOptions);

        return context.sendJson({
            statusCode: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
