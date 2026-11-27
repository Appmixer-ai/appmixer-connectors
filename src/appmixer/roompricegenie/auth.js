'use strict';

const lib = require('./lib');

// A connected account is one property (hotel): the partner's own code for it and the client_id
// and client_secret RoomPriceGenie issued for it
// (https://postman.roompricegenie.com/#4e54762b-4b89-4cfa-8444-9f9ad3d05d91).
//
// The Partner API Key and the API base URL are not in this form. They belong to the partner, not
// to a property: RoomPriceGenie issues one key and one pair of URLs per partner, the plugin route
// needs them without any account, and the people who connect properties should not have to hold
// the partner's key. They are set once in the connector configuration (lib.serviceConfig()).

// The auth context has InvalidTokenError (it marks the account as invalid) and no CancelError.
const invalidCredentials = (context, message) => {

    return context.InvalidTokenError ? new context.InvalidTokenError(message) : new Error(message);
};

/**
 * The property codes an access token names ("aud", or its copy "property_code"), read without
 * verifying the token: it has just arrived from RoomPriceGenie over TLS. Empty when the token is
 * not a JWT or names none.
 * @param {string} token
 * @returns {string[]}
 */
const propertyCodesOf = (token) => {

    try {
        const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8'));
        const read = (value) => (Array.isArray(value) ? value : [value]).filter(item => typeof item === 'string' && item);
        const codes = read(payload.aud);
        return codes.length ? codes : read(payload.property_code);
    } catch (err) {
        return [];
    }
};

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            propertyCode: {
                type: 'text',
                name: 'Property Code',
                tooltip: 'Your own code for the property (hotel), the one RoomPriceGenie knows it by '
                    + '(<code>property_code</code>). It must be a code that never changes.'
            },
            clientId: {
                type: 'text',
                name: 'Client ID',
                tooltip: 'The <code>client_id</code> RoomPriceGenie issued for this property. You get it from '
                    + 'RoomPriceGenie, or from the Create Account component.'
            },
            clientSecret: {
                type: 'password',
                name: 'Client Secret',
                tooltip: 'The <code>client_secret</code> RoomPriceGenie issued for this property. For an account '
                    + 'made with Create Account it works only after the owner has activated the account.'
            }
        },

        accountNameFromProfileInfo: 'name',

        // The API has no "who am I" resource. The account is named after its property code.
        requestProfileInfo: (context) => {

            return { name: String(context.propertyCode || '').trim() || 'RoomPriceGenie' };
        },

        validate: async (context) => {

            // lib.js reads the account from context.auth; in auth.js the fields sit on the context.
            // Without a CancelError on the adapter, lib throws plain errors: a missing connector
            // configuration or an outage must not mark the account as invalid.
            const adapter = {
                auth: {
                    propertyCode: context.propertyCode,
                    clientId: context.clientId,
                    clientSecret: context.clientSecret
                },
                config: context.config,
                httpRequest: (options) => context.httpRequest(options)
            };
            const { propertyCode, clientId, clientSecret } = lib.account(adapter);
            if (!propertyCode || !clientId || !clientSecret) {
                throw invalidCredentials(context, 'Property Code, Client ID and Client Secret are all required.');
            }

            // Throws when the base URL is missing or is not a RoomPriceGenie host, before any
            // request is made.
            lib.serviceConfig(adapter);

            let record;
            try {
                record = await lib.requestTokenWithClientCredentials(adapter);
            } catch (err) {
                const status = err && err.response && err.response.status;
                if (status === 400 || status === 401 || status === 403) {
                    throw invalidCredentials(context, lib.toApiError(adapter, err).message
                        + ' Check the Client ID and Client Secret; an account made with Create Account must be '
                        + 'activated by its owner first.');
                }
                throw lib.requestError(adapter, err);
            }

            const codes = propertyCodesOf(record.accessToken);
            if (codes.length && !codes.includes(propertyCode)) {
                throw invalidCredentials(context, 'These credentials were issued for another property code. '
                    + 'Check the Property Code.');
            }
            return true;
        }
    }
};
