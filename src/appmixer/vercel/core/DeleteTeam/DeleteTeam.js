
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {        

        const { teamId, newDefaultTeamId, slug, reasons|slug, reasons|description } = context.messages.in.content;


        // https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: '/v1/teams/{teamId}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });
    

return context.sendJson(data, 'out');
    }
};
