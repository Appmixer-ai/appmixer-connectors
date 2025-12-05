'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your Amplitude account and find your API Key in the project settings.'
            },
            secretKey: {
                type: 'text',
                name: 'Secret Key',
                tooltip: 'Log into your Amplitude account and find your Secret Key in the project settings.'
            },
            isEU: {
                type: 'text',
                name: 'Use EU Data Center',
                tooltip: 'Type "true" if your Amplitude project is hosted in the EU data center, otherwise leave it blank or type "false".'
            }
        },

        async requestProfileInfo(context) {
            const apiKey = context.apiKey;
            const isEU = context.isEU === 'true';
            return {
                key: `[${isEU ? 'EU' : 'US'}] ` + apiKey.substr(0, 3) + '...' + apiKey.substr(4)
            };
        },
        accountNameFromProfileInfo: 'key',

        validate: async (context) => {
            const isEU = context.isEU === 'true';

            const response = await context.httpRequest({
                method: 'GET',
                url: isEU ? 'https://analytics.eu.amplitude.com/api/3/cohorts' : 'https://amplitude.com/api/3/cohorts',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Basic ${Buffer.from(context.apiKey + ':' + context.secretKey).toString('base64')}`
                },
                data: {
                    user: 'nonexistentuserfortest'
                }
            });

            // If the API key is invalid, Amplitude returns 401 or 403
            // If valid, it returns 200 with a JSON body
            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Invalid response from Amplitude API.');
            }
            return true;
        }
    }
};
