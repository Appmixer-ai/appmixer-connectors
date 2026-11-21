'use strict';

const lib = require('./lib');

// PandaDoc API key authentication: the key is sent as "Authorization: API-Key <key>".
// Keys are generated in PandaDoc under Settings → API and Integrations → API (Dev Center):
// a Sandbox key (free, watermarked documents, 10 requests per minute) or a Production key
// (API plan). The account is identified with GET /public/v1/members/current.
module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'password',
                name: 'API Key',
                tooltip: 'In PandaDoc go to <b>Settings → API and Integrations → API</b>, enable API and Webhooks, open the Dev Center and generate a Sandbox or Production API key.'
            }
        },

        accountNameFromProfileInfo: 'email',

        requestProfileInfo: async (context) => {

            return lib.request(context, { path: '/public/v1/members/current' });
        },

        validate: async (context) => {

            await lib.request(context, { path: '/public/v1/members/current' });
            return true;
        }
    }
};
