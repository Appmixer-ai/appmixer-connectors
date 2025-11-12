'use strict';

module.exports = {
    type: 'apiKey',

    definition: {
        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'text',
                name: 'Root Key',
                tooltip: 'Your Unkey root key from the dashboard. Found at https://app.unkey.com/settings/root-keys'
            }
        },

        accountNameFromProfileInfo: (context) => {
            // Return obfuscated API key as account name since Unkey doesn't provide profile info
            const apiKey = context.profileInfo?.apiKey || context.apiKey;
            if (apiKey) {
                return `unkey_***${apiKey.slice(-4)}`;
            }
            return 'Unkey Account';
        },

        requestProfileInfo: async (context) => {
            // Unkey doesn't have a profile endpoint, return obfuscated API key
            return {
                apiKey: context.apiKey
            };
        },

        validate: async (context) => {
            // Test the API key by listing keys (limited to 1)
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.unkey.dev/v1/keys.listKeys',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    limit: 1
                }
            });
            return true;
        }
    }
};
