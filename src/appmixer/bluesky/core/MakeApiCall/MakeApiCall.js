'use strict';

const lib = require('../../lib');

const BASE_URL = 'https://bsky.social/xrpc/';

function kvToObj(arr) {
    if (!arr || !Array.isArray(arr)) return {};
    const out = {};
    for (const row of arr) {
        if (!row || typeof row !== "object") continue;
        const key = row.key;
        if (typeof key !== "string" || key.length === 0) continue;
        out[key] = row.value;
    }
    return out;
}

module.exports = {

    async receive(context) {

        const { url, method, headers: headersKV, parameters: parametersKV, body } = context.messages.in.content;

        const extraHeaders = kvToObj(headersKV);
        const queryParams = kvToObj(parametersKV);

        if (!url) {
            throw new context.CancelError('API Endpoint Path is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        // Accept full URL, /xrpc/<nsid>, or bare <nsid>
        let targetUrl;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            targetUrl = url;
        } else if (url.startsWith('/')) {
            targetUrl = `https://bsky.social${url}`;
        } else {
            targetUrl = `${BASE_URL}${url}`;
        }

        const accessToken = await lib.getAccessToken(context);

        const requestOptions = {
            method,
            url: targetUrl,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...extraHeaders
            }
        };

        let parsedBody;
        if (body) {
            try {
                parsedBody = typeof body === "object" ? body : JSON.parse(body);
            } catch (e) {
                throw new context.CancelError("Request Body must be valid JSON.");
            }
            requestOptions.data = parsedBody;
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
