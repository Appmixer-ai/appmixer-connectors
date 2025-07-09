
'use strict';

module.exports = {
    async receive(context) {
        const {
            teamId,
            uid,
            email,
            role,
            projects
        } = context.messages.in.content;

        const requestData = {};

        if (uid) requestData.uid = uid;
        if (email) requestData.email = email;
        if (role) requestData.role = role;
        if (projects && Array.isArray(projects) && projects.length > 0) {
            requestData.projects = projects;
        }

        // https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.vercel.com/v1/teams/${teamId}/members`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
