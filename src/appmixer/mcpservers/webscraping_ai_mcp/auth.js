'use strict';

module.exports = {

    type: 'apiKey',

    definition: () => {

        return {
            auth: {
                'WEBSCRAPING_AI_API_KEY': {
                    'type': 'text',
                    'name': 'WEBSCRAPING_AI_API_KEY'
                },
                'WEBSCRAPING_AI_CONCURRENCY_LIMIT': {
                    'type': 'text',
                    'name': 'WEBSCRAPING_AI_CONCURRENCY_LIMIT'
                }
            },

            validate: async (context) => {
                if (!context['WEBSCRAPING_AI_API_KEY']) {
                    throw new Error('Invalid credentials.');
                }
            },

            accountNameFromProfileInfo: (context) => {
                const name = context['WEBSCRAPING_AI_API_KEY'];
                return name.substring(0, 3) + '...' + name.slice(-3);
            }
        };
    }
};
