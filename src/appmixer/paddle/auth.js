'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'password',
                name: 'API Key',
                tooltip: 'Your Paddle API Key. You can find this in your Paddle dashboard under Developer Tools > Authentication.'
            }
        },

        requestProfileInfo(context) {
            const apiKey = context.apiKey;
            return {
                key: apiKey.slice(0, 4) + '...' + apiKey.slice(-3)
            };
        },
        accountNameFromProfileInfo: 'key',

        validate: async (context) => {
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.paddle.com/event-types',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`
                }
            });

            return true;
        }
    }
};
