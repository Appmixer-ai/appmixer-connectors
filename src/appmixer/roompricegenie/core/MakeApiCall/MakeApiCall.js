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

        // The Partner API Key and the access token of the connected property are attached to the
        // request below, so the target is pinned to the configured RoomPriceGenie API host. Any
        // other host is refused.
        const targetUrl = lib.resolveApiUrl(context, url);

        // X-API-Key and Authorization always come from the connector, whatever their spelling in
        // the user's headers.
        const customHeaders = lib.withoutReservedHeaders(
            lib.kvToObject(context, headers, 'Request Headers'), ['Authorization', 'X-API-Key']
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
