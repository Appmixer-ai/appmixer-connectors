'use strict';

module.exports = {
    async receive(context) {

        const { appId } = context.messages.in.content;
        const { baseUrl, apiToken } = context.auth;

        if (!appId) {
            throw new context.CancelError('App ID is required!');
        }

        const cleanBaseUrl = baseUrl.replace(/\/$/, '');

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${cleanBaseUrl}/api/v1/apps/${appId}`,
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson(data, 'out');
    }
};