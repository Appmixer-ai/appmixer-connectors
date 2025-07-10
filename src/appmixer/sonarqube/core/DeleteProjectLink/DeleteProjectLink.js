'use strict';

module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;
        const serverUrl = context.auth.serverUrl.replace(/\/$/, '');

        if (!id) {
            throw new context.CancelError('id is required');
        }

        // https://sonarqube.example.com/web_api/api/project_links/delete
        await context.httpRequest({
            method: 'POST',
            url: `${serverUrl}/api/project_links/delete`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: new URLSearchParams({
                id
            }).toString()
        });

        // Return empty response to indicate success
        return context.sendJson({}, 'out');
    }
};
