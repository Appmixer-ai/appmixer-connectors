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

        const params = lib.kvToObject(parameters);
        const data = lib.parseJsonInput(context, body, 'Request Body');

        // The session token is attached to the request, so the target is pinned to the connected server.
        const send = async (session) => {
            const requestOptions = {
                method,
                url: lib.resolveApiUrl(context, url, session.siteId),
                headers: {
                    'Accept': 'application/json',
                    ...lib.kvToObject(headers),
                    'X-Tableau-Auth': session.token
                }
            };
            if (Object.keys(params).length > 0) {
                requestOptions.params = params;
            }
            if (data !== undefined) {
                requestOptions.data = data;
            }
            return context.httpRequest(requestOptions);
        };

        let session = await lib.getSession(context);
        let response;
        try {
            response = await send(session);
        } catch (err) {
            // The session was ended (e.g. by another sign-in with the same token): sign in once more.
            if (!err.response || err.response.status !== 401) {
                throw err;
            }
            session = await lib.getSession(context, session.token);
            response = await send(session);
        }

        return context.sendJson({
            statusCode: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
