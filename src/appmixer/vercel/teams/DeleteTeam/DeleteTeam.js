
'use strict';

module.exports = {
    async receive(context) {
        const {
            teamId,
            newDefaultTeamId,
            slug,
            reasons
        } = context.messages.in.content;

        const queryParams = {};
        
        if (newDefaultTeamId) queryParams.newDefaultTeamId = newDefaultTeamId;
        if (slug) queryParams.slug = slug;
        
        const requestData = {};
        
        if (reasons) requestData.reasons = reasons;

        // https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.vercel.com/v1/teams/${teamId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            params: queryParams,
            data: Object.keys(requestData).length > 0 ? requestData : undefined
        });

        return context.sendJson(data, 'out');
    }
};
