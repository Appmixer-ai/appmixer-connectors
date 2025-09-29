
'use strict';

module.exports = {

    async receive(context) {

        const { url, events, secret } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('Webhook URL is required');
        }
        if (!events) {
            throw new context.CancelError('Events array is required');
        }

        const requestData = {
            url: url,
            events: events,
            state: 'enabled'
        };

        // Add secret if provided
        if (secret) {
            requestData.secret = secret;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.helpscout.net/v2/webhooks',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
