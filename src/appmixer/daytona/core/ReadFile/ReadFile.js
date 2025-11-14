'use strict';

module.exports = {

    async receive(context) {

        const { sandboxId, path } = context.messages.in.content;

        if (!sandboxId) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        if (!path) {
            throw new context.CancelError('Path is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.daytona.io/sandbox/${sandboxId}/files`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            params: {
                path: path
            }
        });

        return context.sendJson({
            content: data.content || '',
            path: data.path || path,
            size: data.size || 0
        }, 'out');
    }
};
