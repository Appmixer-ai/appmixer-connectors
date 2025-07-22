'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Enter your Resend API key. You can find it in your Resend dashboard under API Keys.'
            }
        },

        accountNameFromProfileInfo: 'apiKey',

        requestProfileInfo: async (context) => {
            return {
                apiKey: `${context.apiKey.substring(0, 8)}...`
            };
        },
        validate: async (context) => {
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.resend.com/v1/domains',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`
                }
            });

            return true;
        }
    }
};
