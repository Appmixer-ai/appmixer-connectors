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

        // The account's access token is attached to the request below, so the target is pinned to
        // the CDP API origin. An absolute URL pointing at another host is refused.
        const targetUrl = lib.resolveApiUrl(context, lib.API_BASE_URL, url);

        // Authorization always comes from the connected account, whatever its spelling in the
        // user's headers. X-Account-Id may be set by the user to read another account the
        // credentials are authorized for; it defaults to the connected account's.
        const userHeaders = lib.kvToObject(context, headers, 'Request Headers');
        const accountKey = Object.keys(userHeaders).find(key => key.toLowerCase() === 'x-account-id');
        const accountId = accountKey ? userHeaders[accountKey] : undefined;
        const customHeaders = lib.withoutReservedHeaders(userHeaders, lib.AUTH_HEADERS);

        const params = lib.kvToObject(context, parameters, 'Query Parameters');
        const data = body ? lib.parseJsonInput(context, body, 'Request Body') : undefined;

        const response = await lib.withToken(context, { accountId }, (authHeaders) => {
            const requestOptions = {
                method,
                url: targetUrl,
                headers: { ...customHeaders, ...authHeaders }
            };
            if (Object.keys(params).length > 0) {
                requestOptions.params = params;
            }
            if (data !== undefined) {
                requestOptions.data = data;
            }
            return context.httpRequest(requestOptions);
        });

        return context.sendJson({
            statusCode: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
