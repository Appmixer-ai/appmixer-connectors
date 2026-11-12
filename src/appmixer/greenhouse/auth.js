'use strict';

const lib = require('./lib');

module.exports = {

    type: 'pwd',

    definition: {

        auth: {
            clientId: {
                type: 'text',
                name: 'Client ID',
                tooltip: 'In Greenhouse go to Configure > Dev Center > API Credential Management, click '
                    + '<b>Create new API credentials</b> and choose <b>Harvest V3 (OAuth)</b>. '
                    + 'Grant the credential the permissions for the endpoints your flows use.'
            },
            clientSecret: {
                type: 'password',
                name: 'Client Secret',
                tooltip: 'The Client Secret of the same Harvest V3 (OAuth) credential.'
            }
        },

        accountNameFromProfileInfo: context => {

            const name = context.clientId || '';
            return name.length > 10 ? name.slice(0, 4) + '...' + name.slice(-4) : name;
        },

        // Harvest v3 custom integrations use the OAuth 2.0 client credentials grant.
        // The token is returned with its lifetime; Appmixer requests a new one with the
        // stored Client ID and Client Secret before it expires.
        validate: async context => {

            return lib.requestToken(context.httpRequest, context.clientId, context.clientSecret);
        }
    }
};
