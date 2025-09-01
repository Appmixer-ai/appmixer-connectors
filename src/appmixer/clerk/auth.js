'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'Secret Key',
                tooltip: 'Your Clerk Secret Key from the API Keys page in the Clerk Dashboard'
            }
        },

        // How to extract account name from profile info
        accountNameFromProfileInfo: (context) => {
            const apiKey = context.apiKey;
            return apiKey.substr(0, 6) + '...' + apiKey.substr(-6);
        },

        // Validate credentials
        validate: async (context) => {
            // Test the API key by making a request to get a list of users (limit 1)
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.clerk.com/v1/users?limit=1',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`
                }
            });

            // If the request doesn't fail, return true
            return true;
        }
    }
};
