'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'apiKey',
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Your MailerLite API key. You can find it in your MailerLite account under Integrations > Developer API.'
            }
        },

        accountNameFromProfileInfo: 'key',

        requestProfileInfo(context) {
            const apiKey = context.apiKey;
            return {
                key: apiKey.substring(0, 12) + '...' + apiKey.slice(-4)
            };
        },

        validate: async (context) => {
            const { data } = await context.httpRequest({
                method: 'GET',
                url: 'https://connect.mailerlite.com/api/timezones',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`
                }
            });

            if (!data || !Array.isArray(data.data)) {
                throw new Error('Authentication failed: Invalid API Key or unexpected response.');
            }
            return true;
        }
    }
};
