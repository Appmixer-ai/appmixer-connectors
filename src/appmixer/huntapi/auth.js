'use strict';

// HuntAPI authenticates every request with an API key sent in the x-api-key header. There is no OAuth2
// flow for the REST API, so API key is the only supported authentication method.
const API_BASE_URL = 'https://api.huntapi.com';

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Sign up at <a href="https://app.huntapi.com" target="_blank">app.huntapi.com</a> and copy your API key from the dashboard.'
            }
        },

        accountNameFromProfileInfo: 'key',

        requestProfileInfo: async context => {

            // The account is labelled with the masked key.
            const apiKey = context.apiKey || '';
            const key = apiKey.length > 12
                ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`
                : 'HuntAPI API key';

            return { key };
        },

        validate: async context => {

            // GET /v1/usage uses no credits and answers 401 for a bad key.
            try {
                await context.httpRequest({
                    method: 'GET',
                    url: `${API_BASE_URL}/v1/usage`,
                    headers: {
                        'x-api-key': context.apiKey,
                        'Accept': 'application/json'
                    }
                });
            } catch (err) {
                // Only a 401 means the key is wrong. Other errors keep their message,
                // so an outage is not reported as an invalid key.
                if (err.response && err.response.status === 401) {
                    throw new Error('Invalid HuntAPI API key.');
                }
                throw err;
            }

            return true;
        }
    }
};
