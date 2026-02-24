'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your Vapi account and find your API key in the API Keys section of your dashboard.'
            }
        },

        async requestProfileInfo(context) {
            const apiKey = context.apiKey;
            return {
                key: apiKey.substring(0, 8) + '*****' + apiKey.substring(apiKey.length - 8)
            };
        },
        accountNameFromProfileInfo: 'key',

        validate: async (context) => {
            // Vapi API: https://api.vapi.ai
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.vapi.ai/assistant',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`
                }
            });
            return true;
        }
    }
};
