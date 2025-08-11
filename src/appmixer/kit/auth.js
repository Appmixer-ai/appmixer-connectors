'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Enter your Kit API Key. You can find it in your account settings under Developer Settings.'
            }
        },

        requestProfileInfo: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.kit.com/v4/account',
                headers: {
                    'X-Kit-Api-Key': context.apiKey
                }
            });

            return response.data;
        },

        accountNameFromProfileInfo: 'account.name',

        validate: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.kit.com/v4/account',
                headers: {
                    'X-Kit-Api-Key': context.apiKey
                }
            });

            if (!response.data || !response.data.account) {
                throw new Error('Authentication failed: Invalid API Key or unexpected response.');
            }
            return true;
        }
    }
};

