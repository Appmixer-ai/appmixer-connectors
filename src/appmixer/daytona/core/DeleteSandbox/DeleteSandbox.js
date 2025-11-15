'use strict';

module.exports = {

    async receive(context) {

        const { sandboxId } = context.messages.in.content;

        if (!sandboxId) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://app.daytona.io/api/sandbox/${sandboxId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
