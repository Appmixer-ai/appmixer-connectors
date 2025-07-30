
'use strict';

module.exports = {
    async receive(context) {

        const { email, role } = context.messages.in.content;
        const { baseUrl, apiToken } = context.auth;

        // Validate required inputs
        if (!email) {
            throw new context.CancelError('Email is required');
        }

        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        
        const requestData = { email };
        if (role) requestData.role = role;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${cleanBaseUrl}/api/v1/users/invite`,
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
