'use strict';

const lib = require('./lib');

// OAuth 2.0 authorization code flow with expiring tokens
// (https://developers.miro.com/docs/getting-started-with-oauth): the access token lasts 60 minutes,
// the refresh token 60 days, and every refresh returns a new refresh token.
const AUTH_URL = 'https://miro.com/oauth/authorize';
const TOKEN_URL = lib.API_ORIGIN + '/v1/oauth/token';

/**
 * POST to the token endpoint. Miro takes the parameters in the query string.
 * @param {object} context
 * @param {object} params
 * @returns {Promise<object>} token response
 */
const tokenRequest = async (context, params) => {

    let data;
    try {
        ({ data } = await context.httpRequest({
            method: 'POST',
            url: TOKEN_URL,
            params
        }));
    } catch (err) {
        const detail = err && err.response && err.response.data;
        if (detail && (detail.message || detail.error || detail.error_description)) {
            const message = detail.message || [detail.error, detail.error_description].filter(Boolean).join(': ');
            throw new Error('Miro token request failed (' + err.response.status + '): ' + message);
        }
        throw err;
    }
    if (!data || !data.access_token) {
        throw new Error('Miro did not return an access token.');
    }
    return data;
};

const toTokens = (data) => {

    const tokens = { accessToken: data.access_token };
    if (data.refresh_token) {
        tokens.refreshToken = data.refresh_token;
        tokens.refreshTokenExpDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    }
    if (data.expires_in) {
        tokens.accessTokenExpDate = new Date(Date.now() + data.expires_in * 1000);
    }
    return tokens;
};

module.exports = {

    type: 'oauth2',

    definition: {

        // Informational: Miro takes the scopes from the app settings. Register the app with these.
        scope: lib.SCOPES,

        accountNameFromProfileInfo: (context) => {

            const profile = context.profileInfo || {};
            const name = profile.userName || profile.userId;
            return profile.teamName ? name + ' (' + profile.teamName + ')' : name;
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

            const data = await tokenRequest(context, {
                grant_type: 'authorization_code',
                client_id: context.clientId,
                client_secret: context.clientSecret,
                code: context.authorizationCode,
                redirect_uri: context.callbackUrl
            });
            return toTokens(data);
        },

        requestProfileInfo: async (context) => {

            const token = await lib.getTokenContext(context);
            const user = token.user || {};
            const team = token.team || {};
            const organization = token.organization || {};
            return {
                userId: user.id,
                userName: user.name,
                teamId: team.id,
                teamName: team.name,
                organizationId: organization.id,
                organizationName: organization.name,
                scopes: token.scopes
            };
        },

        refreshAccessToken: async (context) => {

            const data = await tokenRequest(context, {
                grant_type: 'refresh_token',
                client_id: context.clientId,
                client_secret: context.clientSecret,
                refresh_token: context.refreshToken
            });
            return toTokens(data);
        },

        validateAccessToken: async (context) => {

            await lib.getTokenContext(context);
        }
    }
};
