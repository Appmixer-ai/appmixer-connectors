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

        // The access token of the connected account is attached to the request below, so the
        // target is pinned to the host of the account's Base URL. Any other host is refused.
        const targetUrl = lib.resolveApiUrl(context, url);

        // Authorization always comes from the connector, whatever its spelling in the user's headers.
        const customHeaders = lib.withoutReservedHeaders(
            lib.kvToObject(context, headers, 'Request Headers'), ['Authorization']
        );

        const data = lib.parseJsonInput(context, body, 'Request Body');
        if (data !== undefined && !Object.keys(customHeaders).some(name => name.toLowerCase() === 'content-type')) {
            customHeaders['Content-Type'] = 'application/json';
        }

        const response = await lib.request(context, {
            method,
            url: targetUrl,
            headers: customHeaders,
            params: lib.kvToObject(context, parameters, 'Query Parameters'),
            data
        });

        return context.sendJson({
            statusCode: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
