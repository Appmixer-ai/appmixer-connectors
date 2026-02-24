'use strict';

const BASE_URL = 'https://uptime.betterstack.com/api/v2';

module.exports = {
    async receive(context) {
        const { monitorId } = context.messages.in.content;

        if (!monitorId) {
            throw new context.CancelError('Monitor ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `${BASE_URL}/monitors/${monitorId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
