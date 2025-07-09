'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiToken: {
                type: 'text',
                name: 'Vercel API Token',
                tooltip: 'Log into your Vercel account and create a personal token at https://vercel.com/account/tokens.'
            }
        },

        async requestProfileInfo(context) {
            const apiKey = context.apiToken;
            return {
                key: apiKey.substr(0, 3) + '...' + apiKey.substr(4)
            };
        },
        accountNameFromProfileInfo: 'key',

        validate: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.vercel.com/v2/user',
                headers: {
                    Authorization: `Bearer ${context.apiToken}`
                }
            });
            if (!response.data || !response.data.user || !response.data.user.email) {
                throw new Error('Authentication failed: Could not retrieve user info.');
            }
            return true;
        }
    }
};
