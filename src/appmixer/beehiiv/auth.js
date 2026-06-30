'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your beehiiv account and find your API key in Settings > Workspace Settings > API. Requires Scale plan ($49/mo) or higher.'
            }
        },

        async requestProfileInfo(context) {
            const { data } = await context.httpRequest({
                method: 'GET',
                url: 'https://api.beehiiv.com/v2/publications',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Accept': 'application/json'
                }
            });
            if (data?.data?.length) {
                return { id: data.data[0].id, name: data.data[0].name || 'beehiiv' };
            }
            throw new Error('Could not retrieve beehiiv account info.');
        },

        accountNameFromProfileInfo: 'name',

        validate: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.beehiiv.com/v2/publications',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.data || !response.data.data) {
                throw new Error('Authentication failed: Invalid API key.');
            }
            return true;
        }
    }
};
