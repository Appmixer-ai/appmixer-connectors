'use strict';

module.exports = {

    type: 'apiKey',

    definition: () => {

        return {
            auth: {
                'AWS_ACCESS_KEY_ID': {
                    'type': 'text',
                    'name': 'AWS_ACCESS_KEY_ID'
                },
                'AWS_SECRET_ACCESS_KEY': {
                    'type': 'text',
                    'name': 'AWS_SECRET_ACCESS_KEY'
                },
                'AWS_REGION': {
                    'type': 'text',
                    'name': 'AWS_REGION'
                }
            },

            validate: async (context) => {
                if (!context['AWS_ACCESS_KEY_ID'] || !context['AWS_SECRET_ACCESS_KEY'] || !context['AWS_REGION']) {
                    throw new Error('Invalid credentials.');
                }
            },

            accountNameFromProfileInfo: (context) => {
                const name = context['AWS_ACCESS_KEY_ID'];
                return name.substring(0, 3) + '...' + name.slice(-3);
            }
        };
    }
};
