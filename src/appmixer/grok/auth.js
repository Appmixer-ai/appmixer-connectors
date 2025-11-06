'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Enter your Grok API Key.'
            }
        },

        requestProfileInfo(context) {
            const apiKey = context.apiKey;
            return {
                key: apiKey.substr(0, 3) + '...' + apiKey.substr(4)
            };
        },
        accountNameFromProfileInfo: 'key',

        validate: async (context) => {
            // Replace with a real Grok endpoint if available
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.grok.com/v1/me',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`
                }
            });
            if (!response.data || !response.data.id) {
                throw new Error('Authentication failed: Invalid API Key or unexpected response.');
            }
            return true;
        }
    }
};
