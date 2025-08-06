'use strict';

module.exports = {

    async receive(context) {

        const { name, permission, domain_id: domainId } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('API Key name is required!');
        }

        const requestData = {
            name: name
        };

        if (permission) {
            requestData.permission = permission;
        }

        if (domainId) {
            requestData.domain_id = domainId;
        }

        // https://resend.com/docs/api-reference/api-keys#create-api-key
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.resend.com/api-keys',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
