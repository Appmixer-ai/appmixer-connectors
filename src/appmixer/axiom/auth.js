'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            apiToken: {
                type: 'text',
                name: 'API Token',
                tooltip: 'Your Axiom API token. You can create one in your Axiom account settings.'
            },
            organizationId: {
                type: 'text',
                name: 'Organization ID',
                tooltip: 'Your Axiom organization ID (optional). If not provided, the default organization will be used.'
            }
        },

        accountNameFromProfileInfo: (context) => {
            return context.apiToken.substring(0, 8) + '...';
        },

        requestProfileInfo: async (context) => {
            return context.httpRequest({
                method: 'GET',
                url: 'https://api.axiom.co/v1/user',
                headers: {
                    'Authorization': `Bearer ${context.apiToken}`
                }
            });
        },

        validate: async (context) => {
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.axiom.co/v1/user',
                headers: {
                    'Authorization': `Bearer ${context.apiToken}`
                }
            });
            return true;
        }
    }
};
