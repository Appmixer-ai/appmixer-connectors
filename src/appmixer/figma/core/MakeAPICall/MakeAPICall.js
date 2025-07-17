'use strict';

module.exports = {
    async receive(context) {

        const { resource, method = 'GET', body } = context.messages.in.content;

        const requestConfig = {
            method: method.toUpperCase(),
            url: `https://api.figma.com/v1/${resource}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        };

        // Add Content-Type and body for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
            requestConfig.headers['Content-Type'] = 'application/json';
            if (typeof body === 'string') {
                try {
                    requestConfig.data = JSON.parse(body);
                } catch (e) {
                    requestConfig.data = { message: body };
                }
            } else {
                requestConfig.data = body;
            }
        }

        // https://www.figma.com/developers/api
        const { data } = await context.httpRequest(requestConfig);

        return context.sendJson(data, 'out');
    }
};
