'use strict';

const lib = require('./lib');

// Revinate Porter API credentials (https://porter.revinate.com/documentation#intro-auth): an API
// key and an API secret issued by Revinate, plus the username of a Revinate user who has access to
// that key. The key sees the hotels that user can access. There is no OAuth: every request is
// signed with HMAC-SHA256 (lib.authHeaders). These credentials are separate from the ones of the
// Revinate CDP module.

// The auth context has InvalidTokenError (it marks the account as invalid) and no CancelError.
const invalidCredentials = (context, message) => {

    return context.InvalidTokenError ? new context.InvalidTokenError(message) : new Error(message);
};

const mask = (value) => {

    return value.length > 12 ? `${value.substring(0, 4)}...${value.slice(-4)}` : 'Revinate API key';
};

module.exports = {

    type: 'apiKey',

    name: 'appmixer:revinate:reputation',

    definition: {

        auth: {
            username: {
                type: 'text',
                name: 'Username',
                tooltip: 'The username (e-mail address) of the Revinate user the API key was issued for. '
                    + 'The connection reaches the hotels this user can access.'
            },
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'The Porter API key. Revinate does not offer self-service keys: ask your Revinate '
                    + 'account manager or sales representative for an API key and API secret for the Porter API.'
            },
            apiSecret: {
                type: 'password',
                name: 'API Secret',
                tooltip: 'The API secret that belongs to the API key. Paste it exactly as you received it.'
            }
        },

        accountNameFromProfileInfo: 'username',

        // The API has no "who am I" resource, so the account is named after the username.
        requestProfileInfo: (context) => {

            return {
                username: String(context.username || '').trim(),
                apiKey: mask(String(context.apiKey || '').trim())
            };
        },

        // GET /hotels is what every component depends on and has no side effects.
        validate: async (context) => {

            for (const [field, label] of [['username', 'Username'], ['apiKey', 'API Key'], ['apiSecret', 'API Secret']]) {
                if (!String(context[field] || '').trim()) {
                    throw invalidCredentials(context, `${label} is required.`);
                }
            }

            try {
                await lib.request(context, { path: '/hotels', params: { size: 1 } });
            } catch (err) {
                if (err.response && err.response.status === 401) {
                    throw invalidCredentials(context, err.message);
                }
                // 403, rate limits, outages and network errors keep their message and do not mark
                // the account as invalid.
                throw err;
            }
            return true;
        }
    }
};
