'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your SendGrid account and find <i>API Keys</i> page.'
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
            // https://www.twilio.com/docs/sendgrid/api-reference/users-api/get-a-users-account-information
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.sendgrid.com/v3/user/account',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (response.status !== 200) {
                throw new Error('Authentication failed: Invalid SendGrid API Key or unexpected response.');
            }
            return true;
        }
    }
};
