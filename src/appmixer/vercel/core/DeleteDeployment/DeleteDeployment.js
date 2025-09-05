'use strict';

module.exports = {
    async receive(context) {

        const { id, teamId } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Deployment ID is required');
        }

        // Build query parameters
        const params = new URLSearchParams();
        if (teamId) params.append('teamId', teamId);

        const url = `https://api.vercel.com/v13/deployments/${encodeURIComponent(id)}${params.toString() ? '?' + params.toString() : ''}`;

        // https://vercel.com/docs/rest-api/reference/deployments#delete-deployment
        await context.httpRequest({
            method: 'DELETE',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
