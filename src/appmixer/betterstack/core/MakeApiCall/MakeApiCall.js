'use strict';

module.exports = {
    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = JSON.parse(headers);
            } catch (e) {
                throw new context.CancelError('Headers must be a valid JSON object.');
            }
        }

        let parsedParameters = {};
        if (parameters) {
            try {
                parsedParameters = JSON.parse(parameters);
            } catch (e) {
                throw new context.CancelError('Parameters must be a valid JSON object.');
            }
        }

        const baseUrl = 'https://uptime.betterstack.com/api/v2';
        const targetUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : `${baseUrl}${url}`;

        const queryString = Object.keys(parsedParameters).length
            ? '?' + new URLSearchParams(parsedParameters).toString()
            : '';

        const requestOptions = {
            method,
            url: targetUrl + queryString,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                ...parsedHeaders
            }
        };

        if (body) {
            try {
                requestOptions.data = JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
