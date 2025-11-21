'use strict';

module.exports = {
    async receive(context) {

        const { method, path, headers, body } = context.messages.in.content;

        if (!path) {
            throw new context.CancelError('Path is required!');
        }

        if (!method) {
            throw new context.CancelError('Method is required!');
        }

        // Parse headers if they are provided as a JSON string
        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = typeof headers === 'string' ? JSON.parse(headers) : headers;
            } catch (error) {
                throw new context.CancelError('Headers must be valid JSON format!');
            }
        }

        const requestOptions = {
            method,
            url: path,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json',
                ...parsedHeaders
            }
        };

        if (body && Object.keys(body).length > 0) {
            requestOptions.data = body;
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson(response.data, 'out');
    }
};
