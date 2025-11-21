'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your Mollie dashboard and create an API key in the Developers > API keys section.'
            }
        },

        async requestProfileInfo(context) {
            const apiKey = context.apiKey;
            return {
                key: apiKey.slice(0, 4) + '...' + apiKey.slice(-3)
            };
        },
        accountNameFromProfileInfo: 'key',

        validate: async (context) => {
            // Mollie: https://docs.mollie.com/reference/v2/organizations-api/get-organization
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.mollie.com/v2/profiles/me',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.data || !response.data.id) {
                throw new Error('Authentication failed: Invalid API key or unexpected response.');
            }
            return true;
        }
    }
};
