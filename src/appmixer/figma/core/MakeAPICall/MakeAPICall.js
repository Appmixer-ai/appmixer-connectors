'use strict';

module.exports = {

    async receive(context) {

        const { resource, method = 'GET', body } = context.messages?.in?.content || {};

        if (!resource) {
            throw new context.CancelError('Resource is required');
        }

        if (!method) {
            throw new context.CancelError('Method is required');
        }

        const requestConfig = {
            method: method?.toUpperCase() || 'GET',
            url: `https://api.figma.com/v1/${resource || ''}`,
            headers: {
                'Authorization': `Bearer ${context.auth?.accessToken}`
            }
        };

        // Add body for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(method?.toUpperCase() || 'GET') && body) {
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

        return context.sendJson(data || {}, 'out');
    }
};
