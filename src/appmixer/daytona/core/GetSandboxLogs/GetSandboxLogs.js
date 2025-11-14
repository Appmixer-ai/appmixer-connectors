'use strict';

module.exports = {

    async receive(context) {

        const { sandboxId, tail } = context.messages.in.content;

        if (!sandboxId) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        const params = {};
        if (tail) {
            params.tail = tail;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.daytona.io/sandbox/${sandboxId}/logs`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            params
        });

        return context.sendJson({
            logs: data.logs || data.content || '',
            timestamp: data.timestamp || new Date().toISOString()
        }, 'out');
    }
};
