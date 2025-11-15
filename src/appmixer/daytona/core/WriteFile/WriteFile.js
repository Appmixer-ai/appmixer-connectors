'use strict';

module.exports = {

    async receive(context) {

        const { sandboxId, path, content } = context.messages.in.content;

        if (!sandboxId) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        if (!path) {
            throw new context.CancelError('Path is required!');
        }

        if (!content) {
            throw new context.CancelError('Content is required!');
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: `https://app.daytona.io/api/sandbox/${sandboxId}/files`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                path: path,
                content: content
            }
        });

        return context.sendJson({
            path: response.data.path || path,
            size: response.data.size || content.length
        }, 'out');
    }
};
