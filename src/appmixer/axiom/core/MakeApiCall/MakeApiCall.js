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

        // Parse headers
        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = typeof headers === 'string' ? JSON.parse(headers) : headers;
            } catch (e) {
                throw new context.CancelError('Headers must be valid JSON.');
            }
        }

        // Parse parameters and build query string
        let queryString = '';
        if (parameters) {
            let parsedParams;
            try {
                parsedParams = typeof parameters === 'string' ? JSON.parse(parameters) : parameters;
            } catch (e) {
                throw new context.CancelError('Query Parameters must be valid JSON.');
            }
            const qs = new URLSearchParams(parsedParams).toString();
            if (qs) queryString = '?' + qs;
        }

        const targetUrl = `https://api.axiom.co${url.startsWith('/') ? '' : '/'}${url}` + queryString;

        const requestOptions = {
            method,
            url: targetUrl,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'x-axiom-org-id': context.auth.organizationId,
                'Content-Type': 'application/json',
                ...parsedHeaders
            }
        };

        if (body) {
            try {
                requestOptions.data = typeof body === 'string' ? JSON.parse(body) : body;
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
