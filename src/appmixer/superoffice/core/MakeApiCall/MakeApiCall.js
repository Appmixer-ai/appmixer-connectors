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

        // The account's access token is attached to the request, so the target is pinned to the
        // tenant API the SuperOffice state endpoint returned for this account.
        const apiBase = await lib.getApiBase(context);
        const targetUrl = lib.resolveApiUrl(context, url, apiBase);
        const credentials = lib.authHeaders(context);

        const requestOptions = {
            method,
            url: targetUrl,
            headers: {
                ...credentials,
                ...lib.kvToObject(headers),
                Authorization: credentials.Authorization
            }
        };

        const params = lib.kvToObject(parameters);
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
