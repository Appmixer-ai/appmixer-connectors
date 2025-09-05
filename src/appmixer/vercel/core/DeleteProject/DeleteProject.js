'use strict';

module.exports = {
    async receive(context) {

        const { id, teamId } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Project ID is required');
        }

        // Build query parameters
        let url = `https://api.vercel.com/v9/projects/${encodeURIComponent(id)}`;

        // Add team ID as query parameter if provided
        if (teamId) {
            url += `?teamId=${encodeURIComponent(teamId)}`;
        }

        // https://vercel.com/docs/rest-api/reference/projects#delete-project
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
