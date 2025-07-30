
'use strict';

module.exports = {
    async receive(context) {

        const { app_id, name, description, configuration } = context.messages.in.content;
        const { baseUrl, apiToken } = context.auth;

        // Validate required inputs
        if (!app_id) {
            throw new context.CancelError('App ID is required');
        }

        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        
        const requestData = {};
        if (name) requestData.name = name;
        if (description) requestData.description = description;
        if (configuration) requestData.configuration = configuration;

        // Only make request if there's something to update
        if (Object.keys(requestData).length === 0) {
            throw new context.CancelError('At least one field (name, description, or configuration) must be provided for update');
        }

        await context.httpRequest({
            method: 'PATCH',
            url: `${cleanBaseUrl}/api/v1/apps/${app_id}`,
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        // Update components must return empty object according to standards
        return context.sendJson({}, 'out');
    }
};
