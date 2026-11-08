'use strict';

// cloro authenticates every request with a bearer API key. There is no OAuth2 flow
// for the REST API, so API key is the only supported authentication method.
const API_BASE_URL = 'https://api.cloro.dev';

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Sign up at <a href="https://dashboard.cloro.dev?utm_source=appmixer&utm_medium=byok" target="_blank">dashboard.cloro.dev</a> and copy your key from the <b>API Keys</b> page.'
            }
        },

        accountNameFromProfileInfo: 'key',

        requestProfileInfo: async context => {

            // cloro has no profile endpoint, so we label the account with the masked key.
            const apiKey = context.apiKey || '';
            const key = apiKey.length > 12
                ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`
                : 'cloro API key';

            return { key };
        },

        validate: async context => {

            // GET /v1/credits uses no credits and answers 401 for a bad key.
            try {
                await context.httpRequest({
                    method: 'GET',
                    url: `${API_BASE_URL}/v1/credits`,
                    headers: {
                        'Authorization': `Bearer ${context.apiKey}`
                    }
                });
            } catch (err) {
                // Only a 401 means the key is wrong. Other errors keep their message,
                // so an outage is not reported as an invalid key.
                if (err.response && err.response.status === 401) {
                    throw new Error('Invalid cloro API key.');
                }
                throw err;
            }

            return true;
        }
    }
};
