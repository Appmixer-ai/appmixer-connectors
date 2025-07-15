'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'Personal Access Token',
                tooltip: 'Log into your Figma account and generate a <i>Personal Access Token</i> from your account settings.'
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
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.figma.com/v1/me',
                headers: {
                    'X-Figma-Token': context.apiKey
                }
            });
            if (!response.data || !response.data.email) {
                throw new Error('Authentication failed: Could not retrieve user profile.');
            }
            return true;
        }
    }
};
