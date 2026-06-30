'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your RagieAI account and find your API key at https://ragie.ai/dashboard'
            }
        },

        async requestProfileInfo(context) {
            // RagieAI doesn't have a profile endpoint, return obfuscated API key
            const apiKey = context.apiKey;
            return {
                name: apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4)
            };
        },

        accountNameFromProfileInfo: 'name',

        async validate(context) {
            // Validate by trying to list documents (this should work with any valid API key)
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.ragie.ai/documents',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Accept': 'application/json'
                },
                params: {
                    page_size: 1
                }
            });

            return true;
        }
    }
};
