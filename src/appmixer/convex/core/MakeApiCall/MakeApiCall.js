'use strict';

const BASE_URL = 'https://api.convex.dev';

module.exports = {
    async receive(context) {

        const { url, method, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }

        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        const targetUrl = /^https?:\/\//i.test(url) ? url : `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;

        const headers = {
            'Authorization': `Bearer ${context.auth.apiKey}`,
            'Accept': 'application/json'
        };

        let parsedBody;

        if (body) {
            try {
                parsedBody = JSON.parse(body);
            } catch (error) {
                throw new context.CancelError('Request Body must be valid JSON!');
            }

            headers['Content-Type'] = 'application/json';
        }

        const response = await context.httpRequest({
            method: method,
            url: targetUrl,
            headers,
            ...(parsedBody ? { data: parsedBody } : {})
        });

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
