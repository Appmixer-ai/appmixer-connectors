'use strict';

const lib = require('./lib');

// Upsales authenticates every REST request with an API key passed as the `token`
// query parameter. https://support.upsales.com/hc/en-us/articles/360013328937
module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'password',
                name: 'API Key',
                tooltip: 'An Upsales administrator creates the key under <a href="https://support.upsales.com/hc/en-us/articles/360010164973-How-to-create-an-API-key" target="_blank">Settings &rarr; Account &rarr; Security &rarr; API-keys</a>. The API add-on must be active on the account.'
            }
        },

        accountNameFromProfileInfo: 'accountName',

        requestProfileInfo: async (context) => {

            const { data } = await lib.request(context, { path: '/self', apiKey: context.apiKey });
            const self = data.data || {};
            const clientName = self.client?.name;
            const userName = self.name || self.email;
            return {
                accountName: [clientName, userName].filter(Boolean).join(' - ') || 'Upsales',
                clientId: self.client?.id,
                userId: self.id,
                email: self.email
            };
        },

        validate: async (context) => {

            await lib.request(context, { path: '/self', apiKey: context.apiKey });
            return true;
        }
    }
};
