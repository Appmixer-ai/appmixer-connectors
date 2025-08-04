'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your Replicate account and find your API token at https://replicate.com/account/api-tokens'
            }
        },

        async requestProfileInfo(context) {

            const apiKey = context.apiKey;
            return {
                key: apiKey.substring(0, 3) + '...' + apiKey.slice(-4)
            };
        },

        accountNameFromProfileInfo: 'key',

        async validate(context) {
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.replicate.com/v1/models',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Accept': 'application/json'
                }
            });
            
            return true;
        }
    }
};
