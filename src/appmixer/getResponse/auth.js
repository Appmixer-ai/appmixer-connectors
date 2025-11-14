'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Enter your getResponse API Key. You can find it in your getResponse account under Tools > Integrations & API > API.'
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
            // getResponse API: https://api.getresponse.com/v3/accounts
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.getresponse.com/v3/accounts',
                headers: {
                    'X-Auth-Token': `api-key ${context.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            if (!response.data || !response.data.accountId) {
                throw new Error('Authentication failed: Could not retrieve account info.');
            }
            return true;
        }
    }
};
