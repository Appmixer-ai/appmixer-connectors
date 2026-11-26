'use strict';

const lib = require('./lib');

// SiteMinder Exchange (SMX) has two sets of credentials, both for the whole partner application
// and all of its hotels (https://developer.siteminder.com/smx-api/guides/integration-requirements):
//
// - API Token: the JWT generated in the SMX Partner Portal. The components send it as a Bearer
//   token to read room types, rate plans, availability and rates.
// - Endpoint Username / Endpoint Password: credentials the partner chooses and hands to
//   SiteMinder. SiteMinder puts them into every reservation message it pushes, and the plugin
//   route delivers a message only to flows of the account whose credentials it carries.
//
// Either half can be left empty. SiteMinder wants the reservation endpoint to be live before it
// issues a test environment (and with it the token), so an account must be connectable with the
// endpoint credentials alone; a token-only account can read availability and rates.
//
// A hotel is not part of the account: one set of credentials covers every hotel of the
// application, so the hotel code is an input of the components.

// The auth context has InvalidTokenError (it marks the account as invalid) and no CancelError.
const invalidCredentials = (context, message) => {

    return context.InvalidTokenError ? new context.InvalidTokenError(message) : new Error(message);
};

/**
 * The "sub" claim of the API token (the subscriber code of the application), read without
 * verifying the token. Only used to name the account.
 * @param {string} token
 * @returns {string|undefined}
 */
const subscriberCode = (token) => {

    try {
        const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8'));
        return typeof payload.sub === 'string' && payload.sub ? payload.sub.slice(0, 80) : undefined;
    } catch (err) {
        return undefined;
    }
};

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            environment: {
                type: 'select',
                name: 'Environment',
                placeholder: 'Production',
                tooltip: 'The SiteMinder Exchange environment the API token belongs to. Use Pre-production '
                    + 'while your application is being developed and certified.',
                options: [
                    { label: 'Production', value: 'production' },
                    { label: 'Pre-production (test)', value: 'preproduction' }
                ]
            },
            apiToken: {
                type: 'password',
                name: 'API Token',
                tooltip: 'The Bearer token generated in the SMX Partner Portal. It is needed to read room types, '
                    + 'rate plans, availability and rates. The portal shows it only once. Leave empty if you only '
                    + 'receive reservations.'
            },
            soapUsername: {
                type: 'text',
                name: 'Endpoint Username',
                tooltip: 'The username you gave SiteMinder for your reservation endpoint. SiteMinder sends it with '
                    + 'every reservation, and this account receives only the reservations that carry it. '
                    + 'Leave empty if you only read availability and rates.'
            },
            soapPassword: {
                type: 'password',
                name: 'Endpoint Password',
                tooltip: 'The password you gave SiteMinder for your reservation endpoint: at least 12 characters with '
                    + 'an uppercase letter, a lowercase letter, a number and a special character, without '
                    + '&lt; &gt; &amp; &quot; and &apos;.'
            }
        },

        accountNameFromProfileInfo: 'name',

        // The API has no "who am I" resource. The account is named after the subscriber code in
        // the token, or after the endpoint username.
        requestProfileInfo: (context) => {

            const { environment, apiToken, soapUsername } = lib.account(context);
            const name = (apiToken && subscriberCode(apiToken)) || soapUsername || 'SiteMinder Exchange';
            return { name: environment === 'preproduction' ? `${name} (pre-production)` : name };
        },

        validate: async (context) => {

            const { apiToken, soapUsername, soapPassword } = lib.account(context);
            const hasEndpointCredentials = !lib.isEmpty(soapUsername) || !lib.isEmpty(soapPassword);

            // Throws for an unknown environment before any request is made.
            lib.apiOrigin(context);

            if (!apiToken && !hasEndpointCredentials) {
                throw invalidCredentials(context, 'Fill in the API Token, or the Endpoint Username and Endpoint '
                    + 'Password, or all three.');
            }

            if (hasEndpointCredentials) {
                const problem = lib.endpointCredentialsProblem(soapUsername, soapPassword);
                if (problem) {
                    throw invalidCredentials(context, problem);
                }
            }

            if (apiToken) {
                // GET /publishers is what every component depends on and has no side effects.
                try {
                    await lib.request(context, { segments: ['publishers'] });
                } catch (err) {
                    if (err.response && err.response.status === 401) {
                        throw invalidCredentials(context, err.message);
                    }
                    // 403, rate limits, outages and network errors keep their message and do not
                    // mark the account as invalid.
                    throw err;
                }
            }

            return true;
        }
    }
};
