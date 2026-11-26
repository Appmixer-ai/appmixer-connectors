'use strict';

const lib = require('./lib');

// Revinate CDP API credentials (https://developer.revinate.com/, "Access API with oAuth2
// Authentication"): a Client ID and Client Secret issued by Revinate, and the Revinate Account ID
// the data is read from. The grant is OAuth 2.0 client credentials: there is no consent screen and
// no refresh token, so the account is connected by entering the three values, and the components
// request (and cache) the access token themselves. These credentials are separate from the ones of
// the Revinate Reputation module.

// The auth context has InvalidTokenError (it marks the account as invalid) and no CancelError.
const invalidCredentials = (context, message) => {

    return context.InvalidTokenError ? new context.InvalidTokenError(message) : new Error(message);
};

module.exports = {

    type: 'apiKey',

    name: 'appmixer:revinate:cdp',

    definition: {

        auth: {
            clientId: {
                type: 'text',
                name: 'Client ID',
                tooltip: 'The Client ID of your Revinate CDP API credentials. Revinate does not offer '
                    + 'self-service credentials: ask your Revinate account manager for CDP API access.'
            },
            clientSecret: {
                type: 'password',
                name: 'Client Secret',
                tooltip: 'The Client Secret that belongs to the Client ID.'
            },
            accountId: {
                type: 'text',
                name: 'Account ID',
                tooltip: 'The Revinate Account ID to read data from, for example <code>1928376</code>. It must '
                    + 'be one of the Account IDs your credentials are authorized for. The ID of a chain also '
                    + 'returns the data of its hotels; the ID of a hotel returns only that hotel.'
            }
        },

        accountNameFromProfileInfo: 'accountName',

        // The API has no "who am I" resource, so the account is named after the Account ID.
        requestProfileInfo: (context) => {

            const accountId = String(context.accountId || '').trim();
            return { accountName: `Revinate account ${accountId}`, accountId };
        },

        // Two steps: the token request checks the Client ID and Client Secret, one read of the
        // guest profiles checks that they are authorized for the Account ID.
        validate: async (context) => {

            for (const [field, label] of [
                ['clientId', 'Client ID'], ['clientSecret', 'Client Secret'], ['accountId', 'Account ID']
            ]) {
                if (!String(context[field] || '').trim()) {
                    throw invalidCredentials(context, `${label} is required.`);
                }
            }

            // Refuses an Account ID that could not be sent as a header, before any request.
            try {
                lib.accountId(context);
            } catch (err) {
                throw invalidCredentials(context, err.message);
            }

            let token;
            try {
                ({ token } = await lib.requestToken(context));
            } catch (err) {
                const status = err.response && err.response.status;
                if (status === 401 || status === 403) {
                    throw invalidCredentials(context, err.message);
                }
                throw err;
            }

            try {
                await context.httpRequest({
                    method: 'GET',
                    url: lib.API_BASE_URL + '/api/v2/rich-guest-profiles',
                    headers: lib.authHeaders(context, token)
                });
            } catch (err) {
                const status = err.response && err.response.status;
                if (status === 401 || status === 403) {
                    throw invalidCredentials(context, 'Revinate accepted the Client ID and Client Secret but denied '
                        + `access to Account ID ${String(context.accountId).trim()}. Check the Account ID: it must be one `
                        + 'of the accounts these credentials are authorized for.');
                }
                // Rate limits, outages and network errors keep their message and do not mark the
                // account as invalid.
                throw lib.toApiError(context, err);
            }
            return true;
        }
    }
};
