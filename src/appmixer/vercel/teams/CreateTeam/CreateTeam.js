
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {        

        const { slug, name, attribution|sessionReferrer, attribution|landingPage, attribution|pageBeforeConversionPage, attribution|utm|utmSource, attribution|utm|utmMedium, attribution|utm|utmCampaign, attribution|utm|utmTerm } = context.messages.in.content;


        // https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/v1/teams',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });
    

return context.sendJson(data, 'out');
    }
};
