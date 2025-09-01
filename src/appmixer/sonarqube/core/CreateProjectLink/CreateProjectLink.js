'use strict';

module.exports = {
    async receive(context) {

        const { name, projectId, projectKey, url } = context.messages.in.content;
        const serverUrl = context.auth.serverUrl.replace(/\/$/, '');

        if (!name) {
            throw new context.CancelError('name is required');
        }

        if (!url) {
            throw new context.CancelError('url is required');
        }

        // https://sonarqube.example.com/web_api/api/project_links/create
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${serverUrl}/api/project_links/create`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: new URLSearchParams({
                name,
                ...(projectId ? { projectId } : {}),
                ...(projectKey ? { projectKey } : {}),
                url
            }).toString()
        });

        // Drop the wrapping 'link' object if present
        return context.sendJson(data?.link || data, 'out');
    }
};
