'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your Replicate account and find your API token at https://replicate.com/account/api-tokens'
            }
        },

        async requestProfileInfo(context) {
            // Get account information
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.replicate.com/v1/account',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            return {
                id: response.data.username || response.data.name || 'unknown',
                username: response.data.username,
                name: response.data.name,
                github_url: response.data.github_url
            };
        },

        accountNameFromProfileInfo: 'username',

        async validate(context) {
            // Validate by trying to access the account endpoint
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.replicate.com/v1/account',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            return true;
        }
    }
};
