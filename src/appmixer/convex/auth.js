'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            teamId: {
                type: 'text',
                name: 'Team ID',
                tooltip: 'Enter your Convex Team ID.'
            },
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Enter your Convex API Key.'
            }
        },

        async requestProfileInfo(context) {
            const apiKey = context.apiKey;

            return {
                key: apiKey.substring(0, 3) + '...' + apiKey.slice(-4)
            };
        },
        accountNameFromProfileInfo: 'key',

        validate: async (context) => {
            // Convex API: https://docs.convex.dev/api/rest
            const { data } = await context.httpRequest({
                method: 'GET',
                url: 'https://api.convex.dev/v1/token_details',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!data || !data.teamId) {
                throw new Error('Authentication failed: Invalid API Key or unexpected response.');
            }
            if (data.teamId.toString() !== context.teamId) {
                throw new Error('Authentication failed: Team ID does not match the API Key.');
            }

            return true;
        }
    }
};
