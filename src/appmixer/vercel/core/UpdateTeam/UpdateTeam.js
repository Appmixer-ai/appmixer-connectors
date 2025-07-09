
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {        

        const { teamId, avatar, description, emailDomain, name, previewDeploymentSuffix, regenerateInviteCode, saml|enforced, slug, enablePreviewFeedback, enableProductionFeedback, sensitiveEnvironmentVariablePolicy, remoteCaching|enabled, hideIpAddresses, hideIpAddressesInLogDrains } = context.messages.in.content;


        // https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: '/v2/teams/{teamId}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });
    

return context.sendJson(data, 'out');
    }
};
