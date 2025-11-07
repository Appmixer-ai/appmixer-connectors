'use strict';

module.exports = {
    async receive(context) {
        const { method, path, query, headers, body } = context.messages.in.content;

        // Validate required inputs
        if (!method) {
            throw new context.CancelError('Method is required!');
        }

        if (!path) {
            throw new context.CancelError('Path is required!');
        }

        // Build the URL
        const url = `https://api.mollie.com${path}`;

        // Merge headers
        const mergedHeaders = {
            'Authorization': `Bearer ${context.auth.apiToken}`,
            ...headers
        };

        // Build request options
        const requestOptions = {
            method,
            url,
            headers: mergedHeaders
        };

        // Add query parameters if provided
        if (query && Object.keys(query).length > 0) {
            requestOptions.params = query;
        }

        // Add body if provided
        if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
            requestOptions.data = body;
        }

        // Make the API call
        const response = await context.httpRequest(requestOptions);

        return context.sendJson(response.data || response, 'out');
    }
};
