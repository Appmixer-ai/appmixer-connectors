'use strict';

module.exports = {

    async receive(context) {

        const { sandboxId } = context.messages.in.content;

        if (!sandboxId) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.daytona.io/sandbox/${sandboxId}/stop`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({
            id: data.id || sandboxId,
            status: data.status || 'stopped'
        }, 'out');
    }
};
