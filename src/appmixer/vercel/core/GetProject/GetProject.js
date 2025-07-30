
'use strict';

module.exports = {
    async receive(context) {

        const { id, teamId } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Project ID is required');
        }

        // Build query parameters
        const params = new URLSearchParams();
        if (teamId) params.append('teamId', teamId);

        const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(id)}${params.toString() ? '?' + params.toString() : ''}`;

        // https://vercel.com/docs/rest-api/reference/projects#get-project
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson(data, 'out');
    }
};
