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

        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = typeof headers === 'object' ? headers : JSON.parse(headers);
            } catch (e) {
                throw new context.CancelError('Request Headers must be a valid JSON object.');
            }
        }

        let parsedParameters = {};
        if (parameters) {
            try {
                parsedParameters = typeof parameters === 'object' ? parameters : JSON.parse(parameters);
            } catch (e) {
                throw new context.CancelError('Query Parameters must be a valid JSON object.');
            }
        }

        let parsedBody;
        if (body) {
            try {
                parsedBody = typeof body === 'object' ? body : JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
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

        const queryString = Object.keys(parsedParameters).length
            ? '?' + new URLSearchParams(parsedParameters).toString()
            : '';

        const response = await context.httpRequest({
            method,
            url: targetUrl + queryString,
            data: parsedBody,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                ...parsedHeaders
            }
        });

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
