'use strict';

module.exports = {

    async receive(context) {

        const { url, method, parameters, body } = context.messages.in.content;

        const requestOptions = {
            method,
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (parameters && parameters.length > 0) {
            requestOptions.params = parameters.reduce((acc, { key, value }) => {
                if (key) acc[key] = value;
                return acc;
            }, {});
        }

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
