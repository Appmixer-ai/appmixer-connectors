
'use strict';

module.exports = {
    async receive(context) {

        const { name, description, configuration } = context.messages.in.content;
        const { baseUrl, apiToken } = context.auth;

        // Validate required inputs
        if (!name) {
            throw new context.CancelError('App name is required');
        }

        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        
        const requestData = { name };
        if (description) requestData.description = description;
        if (configuration) requestData.configuration = configuration;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${cleanBaseUrl}/api/v1/apps`,
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
