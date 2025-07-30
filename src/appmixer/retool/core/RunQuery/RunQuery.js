
'use strict';

module.exports = {
    async receive(context) {

        const { app_id, query_id, parameters } = context.messages.in.content;
        const { baseUrl, apiToken } = context.auth;

        // Validate required inputs
        if (!app_id) {
            throw new context.CancelError('App ID is required');
        }
        if (!query_id) {
            throw new context.CancelError('Query ID is required');
        }

        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        
        const requestData = {};
        if (parameters) requestData.parameters = parameters;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${cleanBaseUrl}/api/v1/apps/${app_id}/queries/${query_id}/run`,
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
