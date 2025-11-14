'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Your Daytona API key. Generate one at https://app.daytona.io/dashboard/keys'
            }
        },

        accountNameFromProfileInfo: (context) => {
            return context.profileInfo.apiKey ? `***${context.profileInfo.apiKey.slice(-4)}` : 'Daytona Account';
        },

        requestProfileInfo: async (context) => {
            // Daytona doesn't have a dedicated profile endpoint, so we'll just return the obfuscated API key
            return { apiKey: context.apiKey };
        },

        validate: async (context) => {
            // Validate by attempting to list sandboxes
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.daytona.io/sandbox',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.status === 200;
        }
    }
};
