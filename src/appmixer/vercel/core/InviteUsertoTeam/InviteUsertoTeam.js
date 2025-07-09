
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {        

        const { teamId, uid, email, role, projects|projectId, projects|role } = context.messages.in.content;


        // https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/v1/teams/{teamId}/members',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });
    

return context.sendJson(data, 'out');
    }
};
