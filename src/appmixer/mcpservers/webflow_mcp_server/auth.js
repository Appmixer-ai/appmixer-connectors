'use strict';

module.exports = {

    type: 'apiKey',

    definition: () => {

        return {
            auth: {
                'WEBFLOW_TOKEN': {
                    'type': 'text',
                    'name': 'WEBFLOW_TOKEN'
                }
            },

            validate: async (context) => {
                if (!context['WEBFLOW_TOKEN']) {
                    throw new Error('Invalid credentials.');
                }
            },

            accountNameFromProfileInfo: (context) => {
                const name = context['WEBFLOW_TOKEN'];
                return name.substring(0, 3) + '...' + name.slice(-3);
            }
        };
    }
};
