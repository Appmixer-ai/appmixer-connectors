'use strict';

const lib = require('../../lib');

function kvToObj(arr) {
    if (!arr || !Array.isArray(arr)) return {};
    return Object.fromEntries(arr.map(({ key, value }) => [key, value]));
}

module.exports = {

    async receive(context) {

        const { url, method, headers: headersKV, parameters: parametersKV, body: bodyKV } = context.messages.in.content;

        const extraHeaders = kvToObj(headersKV);
        const queryParams = kvToObj(parametersKV);
        const bodyData = kvToObj(bodyKV);

        if (!url) {
            throw new context.CancelError('API Endpoint Path is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        // Accept full URL or path (leading slash optional)
        let targetUrl;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            targetUrl = url;
        } else if (url.startsWith('/')) {
            targetUrl = `${lib.BASE_URL}${url}`;
        } else {
            targetUrl = `${lib.BASE_URL}/${url}`;
        }

        const requestOptions = {
            method,
            url: targetUrl,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                ...extraHeaders
            }
        };

        if (Object.keys(bodyData).length > 0) {
            requestOptions.data = bodyData;
        }

        if (Object.keys(queryParams).length > 0) {
            requestOptions.params = queryParams;
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
