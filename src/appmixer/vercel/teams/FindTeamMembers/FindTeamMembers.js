
'use strict';

module.exports = {
    async receive(context) {
        const {
            teamId,
            limit,
            since,
            until,
            role,
            search,
            excludeProject,
            eligibleMembersForProjectId
        } = context.messages.in.content;

        const queryParams = {};
        
        if (limit) queryParams.limit = limit;
        if (since) queryParams.since = since;
        if (until) queryParams.until = until;
        if (role) queryParams.role = role;
        if (search) queryParams.search = search;
        if (excludeProject) queryParams.excludeProject = excludeProject;
        if (eligibleMembersForProjectId) queryParams.eligibleMembersForProjectId = eligibleMembersForProjectId;
        
        // https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.vercel.com/v3/teams/${teamId}/members`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params: queryParams
        });

        return context.sendJson(data, 'out');
    }
};
