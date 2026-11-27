'use strict';

const lib = require('./lib');

// A connected account is one IDeaS environment and one property: the OAuth 2.0 client
// credentials IDeaS issued during onboarding, the environment host they belong to, and the chain
// code and hotel code IDeaS checks them against ("OAuth, ChainCode and HotelCode combination is
// valid", https://developers.ideas.com/developer-guide/request/). The codes are in the account and
// not in the components because IDeaS binds the credentials to them: a flow cannot send data for
// a property its account is not allowed to send for, and the person building the flow does not
// have to know them.
//
// The environment host is in the account because IDeaS does not publish it ("Environment-specific
// URLs will be provided depending on your integration setup") and issues a test and a production
// one. lib.account() accepts only hosts under ideasrms.com or ideas.com, plus hosts an administrator
// allowed in the connector configuration ("additionalApiHosts").

// The auth context has InvalidTokenError (it marks the account as invalid) and no CancelError.
const invalidCredentials = (context, message) => {

    return context.InvalidTokenError ? new context.InvalidTokenError(message) : new Error(message);
};

/**
 * lib.js reads the account from context.auth; in auth.js the fields sit on the context itself.
 * The adapter has no CancelError, no cache and no lock, so lib throws plain errors and requests a
 * token without caching it.
 * @param {object} context auth context
 * @returns {object}
 */
const adapterOf = (context) => ({
    auth: {
        baseUrl: context.baseUrl,
        tokenUrl: context.tokenUrl,
        clientId: context.clientId,
        clientSecret: context.clientSecret,
        clientCode: context.clientCode,
        propertyCode: context.propertyCode
    },
    config: context.config,
    httpRequest: (options) => context.httpRequest(options)
});

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            baseUrl: {
                type: 'text',
                name: 'Base URL',
                tooltip: 'The API host of your IDeaS environment, as IDeaS gave it to you during onboarding, for '
                    + 'example <code>https://api.example.ideasrms.com</code>. IDeaS issues one for testing and one '
                    + 'for production. Use <code>https://api-mock-service.ideasrms.com</code> to check payloads '
                    + 'against the public schema validation service: it takes no credentials and never reports a '
                    + 'processing result.'
            },
            clientId: {
                type: 'text',
                name: 'Client ID',
                tooltip: 'The OAuth <code>client_id</code> IDeaS issued for this integration.'
            },
            clientSecret: {
                type: 'password',
                name: 'Client Secret',
                tooltip: 'The OAuth <code>client_secret</code> IDeaS issued with the Client ID.'
            },
            clientCode: {
                type: 'text',
                name: 'Client Code (Chain Code)',
                tooltip: 'The chain code IDeaS knows the hotel by, sent as <code>clientCode</code>.'
            },
            propertyCode: {
                type: 'text',
                name: 'Property Code (Hotel Code)',
                tooltip: 'The hotel code IDeaS knows the property by, sent as <code>propertyCode</code>.'
            },
            tokenUrl: {
                type: 'text',
                name: 'Token URL',
                tooltip: 'Optional. Fill in only when IDeaS gave you a token endpoint on another host than the Base '
                    + 'URL. By default the token is requested from <code>/api/uis/external_m2m/oauth2/token</code> '
                    + 'on the Base URL host.'
            }
        },

        accountNameFromProfileInfo: 'name',

        // The API has no "who am I" resource. The account is named after its codes.
        requestProfileInfo: (context) => {

            const read = (value) => String(value || '').trim();
            const codes = [read(context.clientCode), read(context.propertyCode)].filter(Boolean).join(' / ');
            return { name: codes || read(context.clientId) || 'IDeaS' };
        },

        validate: async (context) => {

            const adapter = adapterOf(context);
            let acc;
            try {
                // Refuses a Base URL or Token URL that is not an IDeaS host before any request.
                acc = lib.account(adapter);
            } catch (err) {
                throw invalidCredentials(context, err.message);
            }
            if (!acc.clientId || !acc.clientSecret || !acc.clientCode || !acc.propertyCode) {
                throw invalidCredentials(context,
                    'Client ID, Client Secret, Client Code and Property Code are all required.');
            }
            if (acc.mock) {
                // The schema validation service has no token endpoint: nothing to check.
                return true;
            }

            // One token request. It counts against the 6 tokens an hour IDeaS recommends; the
            // auth context has no cache to keep the token in.
            try {
                await lib.requestToken(adapter, acc);
            } catch (err) {
                const status = err && err.response && err.response.status;
                if (status === 400 || status === 401 || status === 403) {
                    throw invalidCredentials(context, err.message);
                }
                throw err;
            }
            return true;
        }
    }
};
