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

        // The account's API token is attached to every request below, so the target
        // has to be pinned to the Manychat API origin. Without this an absolute URL
        // pointing at a third-party host would leak the token to that host.
        const targetUrl = lib.resolveApiUrl(context, url);

        // Drop any user-supplied Authorization header, whatever its case, so only the
        // connected account's token is sent.
        const userHeaders = Object.fromEntries(
            Object.entries(lib.kvToObject(context, headers)).filter(([key]) => !/^authorization$/i.test(key))
        );
        const requestOptions = {
            method,
            url: targetUrl,
            headers: {
                ...userHeaders,
                ...lib.authHeaders(context)
            }
        };

        const params = lib.kvToObject(context, parameters);
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
