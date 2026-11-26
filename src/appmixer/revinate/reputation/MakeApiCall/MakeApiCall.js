'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint Path is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        // The request below is signed with the account's API key and secret, so the target is
        // pinned to the Porter API origin. An absolute URL pointing at another host is refused.
        const targetUrl = lib.resolveApiUrl(context, lib.API_BASE_URL, url);

        // The four authentication headers always come from the connected account, whatever their
        // spelling in the user's headers.
        const customHeaders = lib.withoutReservedHeaders(
            lib.kvToObject(context, headers, 'Request Headers'), lib.AUTH_HEADERS
        );

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
