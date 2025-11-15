'use strict';

module.exports = {

    async receive(context) {

        const { sandboxId } = context.messages.in.content;

        if (!sandboxId) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://app.daytona.io/api/sandbox/${sandboxId}/start`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({
            id: data.id || sandboxId,
            status: data.status || 'running'
        }, 'out');
    }
};
