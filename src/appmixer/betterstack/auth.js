'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'text',
                name: 'Uptime API Token',
                tooltip: 'Team-based or global Better Stack Uptime API token.'
            }
        },

        accountNameFromProfileInfo: 'apiKey',

        requestProfileInfo: async (context) => {
            return {
                apiKey: `${context.apiKey.substring(0, 8)}...${context.apiKey.substring(context.apiKey.length - 4)}`
            };
        },

        validate: async (context) => {
            await context.httpRequest({
                method: 'GET',
                url: 'https://uptime.betterstack.com/api/v2/monitors?per_page=1',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`
                }
            });
            return true;
        }
    }
};
