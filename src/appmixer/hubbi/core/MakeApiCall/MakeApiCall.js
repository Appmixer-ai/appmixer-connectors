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

        const targetUrl = /^https?:\/\//.test(url)
            ? url
            : lib.apiUrl(context, url.startsWith('/') ? url : `/${url}`);

        const requestOptions = {
            method,
            url: targetUrl,
            headers: {
                ...lib.kvToObject(headers),
                'Authorization': `Bearer ${context.auth.token}`,
                'Accept': 'application/json'
            }
        };

        // Every HubBI endpoint is scoped by clientKey, so it is filled in from
        // the connected account rather than being retyped for every call. An
        // explicit value still wins, so a call can be pointed at a different
        // client when that is what the user wants.
        const params = { clientKey: context.auth.clientKey, ...lib.kvToObject(parameters) };

        requestOptions.params = params;

        if (body) {
            try {
                requestOptions.data = typeof body === 'object' ? body : JSON.parse(body);
            } catch (err) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
            requestOptions.headers['Content-Type'] = 'application/json';
        }

        let response;
        try {
            response = await context.httpRequest(requestOptions);
        } catch (err) {
            // Same retry semantics the other HubBI actions use: 409 is
            // transient here, 423 is permanent.
            lib.rethrowHubbiError(context, err);
        }

        return context.sendJson({
            statusCode: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
