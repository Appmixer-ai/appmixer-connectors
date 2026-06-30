'use strict';

module.exports = {

    async receive(context) {

        const { statusPageId } = context.messages.in.content;

        if (!statusPageId) {
            throw new context.CancelError('Status page ID is required!');
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: `https://uptime.betterstack.com/api/v2/status-pages/${statusPageId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const result = { ...response.data.data.attributes, id: response.data.data.id };
        return context.sendJson(result, 'out');
    }
};
