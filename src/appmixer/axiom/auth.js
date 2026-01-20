'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            apiToken: {
                type: 'text',
                name: 'Personal Access Token (PAT)',
                tooltip: 'Your Axiom personal access token. You can create one in your Axiom account settings.'
            },
            organizationId: {
                type: 'text',
                name: 'Organization ID',
                tooltip: 'Your Axiom organization ID. You can find it in your Axiom account.'
            }
        },

        accountNameFromProfileInfo: (context) => {
            return context.apiToken.substring(0, 8) + '...';
        },

        requestProfileInfo: async (context) => {
            // Use /v2/user endpoint as per OpenAPI docs, require PAT and orgId
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.axiom.co/v2/user',
                headers: {
                    'Authorization': `Bearer ${context.apiToken}`,
                    'x-axiom-org-id': context.organizationId
                }
            });
            return response.data || response;
        },

        validate: async (context) => {
            // Use /v2/user endpoint as per OpenAPI docs, require PAT and orgId
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.axiom.co/v2/user',
                headers: {
                    'Authorization': `Bearer ${context.apiToken}`,
                    'x-axiom-org-id': context.organizationId
                }
            });
            return true;
        }
    }
};
