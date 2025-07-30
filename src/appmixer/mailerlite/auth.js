'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your MailerLite account and find your API Key in the Integrations or Developer API section.'
            }
        },

        async requestProfileInfo(context) {
            const apiKey = context.apiKey;
            return {
                key: apiKey.substr(0, 3) + '...' + apiKey.substr(4)
            };
        },
        accountNameFromProfileInfo: 'key',

        validate: async (context) => {
            // MailerLite API v2: https://api.mailerlite.com/api/v2/me
            // MailerLite API v2 expects the API key in the 'X-MailerLite-ApiKey' header
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.mailerlite.com/api/v2/me',
                headers: {
                    'X-MailerLite-ApiKey': context.apiKey
                }
            });
            if (!response.data || !response.data.email) {
                throw new Error('Authentication failed: Invalid API Key or unexpected response.');
            }
            return true;
        }
    }
};
