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

        const requestOptions = {
            method: method,
            url: `https://api.axiom.co${url}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'x-axiom-org-id': context.auth.organizationId,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            requestOptions.data = JSON.parse(body);
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
