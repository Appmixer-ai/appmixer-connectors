'use strict';

const lib = require('./lib');

// OAuth 2.0 per https://github.com/SurveyMonkey/public_api_docs/blob/main/includes/_overview.md
// ("OAuth 2.0 Flow"). Access tokens are long-lived and there is no refresh token.
const AUTH_URL = 'https://api.surveymonkey.com/oauth/authorize';
const TOKEN_URL = 'https://api.surveymonkey.com/oauth/token';

// The token exchange returns the account's API host (access_url). requestProfileInfo() stores it
// in the profile; until then it is kept here, keyed by the new access token.
const pendingAccessUrls = new Map();
const MAX_PENDING = 100;

const rememberAccessUrl = (accessToken, origin) => {

    pendingAccessUrls.set(accessToken, origin);
    if (pendingAccessUrls.size > MAX_PENDING) {
        pendingAccessUrls.delete(pendingAccessUrls.keys().next().value);
    }
};

module.exports = {

    type: 'oauth2',

    definition: {

        // Informational: SurveyMonkey takes the scopes from the app settings, not from the
        // authorization URL. Register the app with these scopes.
        scope: lib.SCOPES,

        accountNameFromProfileInfo: (context) => {

            const profile = context.profileInfo || {};
            return profile.email || profile.username || profile.id;
        },

        emailFromProfileInfo: (context) => {

            return (context.profileInfo || {}).email;
        },

        authUrl: (context) => {

            const url = new URL(AUTH_URL);
            url.searchParams.set('response_type', 'code');
            url.searchParams.set('client_id', context.clientId);
            url.searchParams.set('redirect_uri', context.callbackUrl);
            url.searchParams.set('state', context.ticket);
            return url.toString();
        },

        requestAccessToken: async (context) => {

            const body = new URLSearchParams({
                client_id: context.clientId,
                client_secret: context.clientSecret,
                code: context.authorizationCode,
                redirect_uri: context.callbackUrl,
                grant_type: 'authorization_code'
            });

            let data;
            try {
                ({ data } = await context.httpRequest({
                    method: 'POST',
                    url: TOKEN_URL,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: body.toString()
                }));
            } catch (err) {
                const detail = err && err.response && err.response.data;
                if (detail && (detail.error || detail.error_description)) {
                    const message = [detail.error, detail.error_description].filter(Boolean).join(': ');
                    throw new Error('SurveyMonkey token request failed (' + err.response.status + '): ' + message);
                }
                throw err;
            }

            if (!data || !data.access_token) {
                throw new Error('SurveyMonkey did not return an access token.');
            }
            if (data.access_url) {
                const origin = lib.trustedOrigin(data.access_url);
                if (!origin) {
                    throw new Error('SurveyMonkey returned an unsupported API host: ' + data.access_url);
                }
                rememberAccessUrl(data.access_token, origin);
            }

            return { accessToken: data.access_token };
        },

        requestProfileInfo: async (context) => {

            const known = pendingAccessUrls.get(context.accessToken);
            pendingAccessUrls.delete(context.accessToken);
            // Without the access_url (another process handled the token exchange) the data center
            // is the one that accepts the token.
            const { origin, user } = await lib.findAccountOrigin(context, known ? [known] : lib.API_ORIGINS);

            return {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                accountType: user.account_type,
                accessUrl: origin
            };
        },

        validateAccessToken: async (context) => {

            const origin = lib.trustedOrigin((context.profileInfo || {}).accessUrl);
            await lib.findAccountOrigin(context, origin ? [origin] : lib.API_ORIGINS);
        }
    }
};
