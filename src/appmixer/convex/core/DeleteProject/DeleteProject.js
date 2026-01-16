'use strict';

module.exports = {
    async receive(context) {

        const { projectId } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        // https://docs.convex.dev/management-api
        await context.httpRequest({
            method: 'POST',
            url: `https://api.convex.dev/v1/projects/${projectId}/delete`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
