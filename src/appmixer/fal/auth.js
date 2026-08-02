'use strict';

const lib = require('./lib');

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Create a key at <a href="https://fal.ai/dashboard/keys" target="_blank">fal.ai/dashboard/keys</a>. The secret is shown only once and belongs to your whole account or team (members share a single key). Paste the <code>FAL_KEY</code> value here.'
            }
        },

        requestProfileInfo(context) {
            const apiKey = context.apiKey || '';
            return {
                key: apiKey.length > 16
                    ? `${apiKey.substring(0, 12)}...${apiKey.slice(-4)}`
                    : 'fal API key'
            };
        },

        accountNameFromProfileInfo: 'key',

        validate: async (context) => {

            // Validate against an endpoint that REQUIRES authentication (returns
            // 401 unauthenticated). Do NOT use /v1/models — auth is optional there,
            // so it returns 200 even with an invalid key and would silently accept
            // broken credentials.
            await context.httpRequest({
                method: 'GET',
                url: `${lib.PLATFORM_URL}/storage/settings`,
                headers: {
                    Authorization: `Key ${context.apiKey}`
                }
            });
            return true;
        }
    }
};
