'use strict';

// Asin authenticates every request with an API key sent as a Bearer token. There is no OAuth2
// flow for the REST API, so API key is the only supported authentication method.
const API_BASE_URL = 'https://www.asin.dev';

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Sign up at <a href="https://www.asin.dev/app" target="_blank">www.asin.dev/app</a> and copy your API key from the dashboard.'
            }
        },

        accountNameFromProfileInfo: 'key',

        requestProfileInfo: async context => {

            // The account is labelled with the masked key.
            const apiKey = context.apiKey || '';
            const key = apiKey.length > 12
                ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`
                : 'Asin API key';

            return { key };
        },

        validate: async context => {

            // GET /api/v1/account uses no credits and answers 401 for a bad key.
            try {
                await context.httpRequest({
                    method: 'GET',
                    url: `${API_BASE_URL}/api/v1/account`,
                    headers: {
                        'Authorization': `Bearer ${context.apiKey}`,
                        'Accept': 'application/json'
                    }
                });
            } catch (err) {
                // Only a 401 means the key is wrong. Other errors keep their message,
                // so an outage is not reported as an invalid key.
                if (err.response && err.response.status === 401) {
                    throw new Error('Invalid Asin API key.');
                }
                throw err;
            }

            return true;
        }
    }
};
