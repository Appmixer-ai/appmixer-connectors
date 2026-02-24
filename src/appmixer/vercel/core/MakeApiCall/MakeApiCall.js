'use strict';

module.exports = {
    async receive(context) {

        const { url, method, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }

        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        const targetUrl = url.startsWith('https://') || url.startsWith('http://')
            ? url
            : `https://api.vercel.com${url}`;

        const requestOptions = {
            method: method,
            url: targetUrl,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            try {
                requestOptions.data = JSON.parse(body);
            } catch (error) {
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
