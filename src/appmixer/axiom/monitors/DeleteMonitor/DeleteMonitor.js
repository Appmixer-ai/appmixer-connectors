'use strict';

module.exports = {

    async receive(context) {

        const { monitorId } = context.messages.in.content;

        if (!monitorId) {
            throw new context.CancelError('Monitor ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.axiom.co/v1/monitors/${monitorId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
