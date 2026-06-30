'use strict';

module.exports = {

    async receive(context) {

        const { statusPageId } = context.messages.in.content;

        if (!statusPageId) {
            throw new context.CancelError('Status page ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://uptime.betterstack.com/api/v2/status-pages/${statusPageId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
