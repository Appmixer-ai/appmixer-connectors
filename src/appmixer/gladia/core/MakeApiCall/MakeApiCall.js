'use strict';

const lib = require('../../lib');

// Convert Appmixer key-value inspector rows into a plain object.
function kvToObject(rows) {
    if (!Array.isArray(rows)) {
        return {};
    }
    const result = {};
    for (const row of rows) {
        if (!row || typeof row.key !== 'string' || !row.key) {
            continue;
        }
        result[row.key] = row.value;
    }
    return result;
}

module.exports = {

    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint Path is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        let targetUrl;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            targetUrl = url;
        } else {
            targetUrl = `${lib.API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
        }

        const requestOptions = {
            method,
            url: targetUrl,
            headers: {
                ...kvToObject(headers),
                'x-gladia-key': context.auth.apiKey
            }
        };

        const params = kvToObject(parameters);
        if (Object.keys(params).length > 0) {
            requestOptions.params = params;
        }

        if (body) {
            try {
                requestOptions.data = typeof body === 'object' ? body : JSON.parse(body);
            } catch (error) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
            requestOptions.headers['Content-Type'] = 'application/json';
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            statusCode: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
