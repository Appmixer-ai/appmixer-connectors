
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { teamId, role, search } = context.messages.in.content;

        // https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/v3/teams/{teamId}/members',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
