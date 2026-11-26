'use strict';

const lib = require('./lib');

// Cal.com API v2 with an API key. The key is created in Cal.com under Settings → Security →
// API Keys and sent as "Authorization: Bearer <key>". The account is identified with GET /v2/me.
module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'password',
                name: 'API Key',
                tooltip: 'In Cal.com go to <b>Settings → Security → API Keys</b> and create a key. Keys start with <code>cal_</code> (test mode) or <code>cal_live_</code>.'
            }
        },

        accountNameFromProfileInfo: 'email',

        requestProfileInfo: async (context) => {

            const body = await lib.request(context, { path: '/v2/me' });
            return body.data;
        },

        validate: async (context) => {

            await lib.request(context, { path: '/v2/me' });
            return true;
        }
    }
};
