'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'text',
                name: 'Private API Key',
                tooltip: 'Your Klaviyo Private API Key. Find it in Account > Settings > API Keys in your Klaviyo dashboard.'
            }
        },

        accountNameFromProfileInfo: 'data.attributes.organization_name',

        async requestProfileInfo(context) {

            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://a.klaviyo.com/api/accounts/',
                headers: {
                    'Authorization': `Klaviyo-API-Key ${context.apiKey}`,
                    'Accept': 'application/vnd.api+json',
                    'Revision': '2025-07-15'
                }
            });

            if (response.data &&
                response.data.data &&
                Array.isArray(response.data.data) &&
                response.data.data.length > 0
            ) {
                return response.data.data[0];
            }

            throw new Error('Failed to retrieve account information');
        },

        validate: async (context) => {

            await context.httpRequest({
                method: 'GET',
                url: 'https://a.klaviyo.com/api/profiles',
                headers: {
                    'Authorization': `Klaviyo-API-Key ${context.apiKey}`,
                    'Accept': 'application/vnd.api+json',
                    'Revision': '2025-07-15'
                },
                params: {
                    'page[size]': 1 // Limit to 1 profile to validate the API key
                }
            });

            return true;
        }
    }
};
