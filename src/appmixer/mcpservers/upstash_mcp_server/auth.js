'use strict';

module.exports = {

    type: 'apiKey',

    definition: () => {

        return {
            auth: {
                'UPSTASH_EMAIL': {
                    'type': 'text',
                    'name': 'UPSTASH_EMAIL'
                },
                'UPSTASH_API_KEY': {
                    'type': 'text',
                    'name': 'UPSTASH_API_KEY'
                }
            },

            validate: async (context) => {
                if (!context['UPSTASH_EMAIL'] || !context['UPSTASH_API_KEY']) {
                    throw new Error('Invalid credentials.');
                }
            },

            accountNameFromProfileInfo: (context) => {
                const name = context['UPSTASH_EMAIL'];
                if (name.length <= 6) {
                    return name;
                }
                return name.substring(0, 3) + '...' + name.slice(-3);
            }
        };
    }
};
