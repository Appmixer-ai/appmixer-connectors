'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your PDF.co account and find your API Key in the dashboard.'
            }
        },

        async requestProfileInfo(context) {
            const apiKey = context.apiKey;
            return {
                key: apiKey.substr(0, 3) + '...' + apiKey.substr(-3)
            };
        },
        accountNameFromProfileInfo: 'key',

        validate: async (context) => {
            // PDF.co API: https://apidocs.pdf.co
            // We'll use /v1/account/credit/balance endpoint to validate the API key
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.pdf.co/v1/account/credit/balance',
                headers: {
                    'x-api-key': context.apiKey
                }
            });
            return response;
        }
    }
};

