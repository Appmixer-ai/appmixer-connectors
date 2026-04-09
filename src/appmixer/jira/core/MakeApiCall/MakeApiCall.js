'use strict';

module.exports = {

    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;
        const { profileInfo, auth } = context;

        // profileInfo.apiUrl = https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/
        // Strip trailing slash so path like /issue/ID works cleanly
        const baseUrl = profileInfo.apiUrl.replace(/\/$/, '');
        const fullUrl = baseUrl + url;

        const requestOptions = {
            method,
            url: fullUrl,
            headers: {
                'Authorization': `Bearer ${auth.accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (headers && headers.length > 0) {
            headers.forEach(({ key, value }) => {
                if (key) requestOptions.headers[key] = value;
            });
        }

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
