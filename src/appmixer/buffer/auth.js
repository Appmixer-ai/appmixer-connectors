'use strict';

const crypto = require('crypto');
const lib = require('./lib');

const AUTH_URL = 'https://auth.buffer.com/auth';
const TOKEN_URL = 'https://auth.buffer.com/token';

/**
 * PKCE code verifier (Buffer requires PKCE S256 for every OAuth client).
 * Appmixer calls authUrl() and requestAccessToken() in separate requests and keeps nothing
 * between them except the ticket, so the verifier is derived from the ticket. The ticket is
 * also the public `state`, therefore it is keyed with the client secret, which never leaves
 * the server: whoever sees the redirect cannot compute the verifier.
 * Base64url of a SHA-256 digest is 43 characters, the minimum length RFC 7636 allows.
 * @param {object} context
 * @returns {string}
 */
const getCodeVerifier = (context) => {

    return crypto.createHmac('sha256', String(context.clientSecret || ''))
        .update(String(context.ticket))
        .digest('base64url');
};

const getCodeChallenge = (verifier) => {

    return crypto.createHash('sha256').update(verifier).digest('base64url');
};

const toExpDate = (expiresIn) => {

    // Buffer access tokens live about an hour (expires_in: 3600).
    return new Date(Date.now() + (Number(expiresIn) || 3600) * 1000);
};

const requestToken = async (context, params) => {

    const { data } = await context.httpRequest({
        method: 'POST',
        url: TOKEN_URL,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: new URLSearchParams({
            client_id: context.clientId,
            client_secret: context.clientSecret,
            ...params
        }).toString()
    });
    return data;
};

module.exports = {

    type: 'oauth2',

    definition: {

        scope: [
            'account:read',
            'posts:read',
            'posts:write',
            'ideas:read',
            'ideas:write',
            'offline_access'
        ],

        accountNameFromProfileInfo: (context) => {

            return context.profileInfo.email || context.profileInfo.name || context.profileInfo.id;
        },

        authUrl: (context) => {

            const url = new URL(AUTH_URL);
            url.searchParams.set('client_id', context.clientId);
            url.searchParams.set('redirect_uri', context.callbackUrl);
            url.searchParams.set('response_type', 'code');
            url.searchParams.set('scope', context.scope.join(' '));
            url.searchParams.set('state', context.ticket);
            url.searchParams.set('code_challenge', getCodeChallenge(getCodeVerifier(context)));
            url.searchParams.set('code_challenge_method', 'S256');
            url.searchParams.set('prompt', 'consent');
            return url.toString();
        },

        requestAccessToken: async (context) => {

            const data = await requestToken(context, {
                grant_type: 'authorization_code',
                code: context.authorizationCode,
                redirect_uri: context.callbackUrl,
                code_verifier: getCodeVerifier(context)
            });

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                accessTokenExpDate: toExpDate(data.expires_in)
            };
        },

        requestProfileInfo: async (context) => {

            const data = await lib.graphql(context, 'query Profile { account { id email name } }');
            return data.account;
        },

        // Buffer refresh tokens are single-use: every refresh returns a new refresh token and
        // invalidates the one sent, so the new one is returned for Appmixer to store.
        refreshAccessToken: async (context) => {

            const data = await requestToken(context, {
                grant_type: 'refresh_token',
                refresh_token: context.refreshToken
            });

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || context.refreshToken,
                accessTokenExpDate: toExpDate(data.expires_in)
            };
        },

        validateAccessToken: async (context) => {

            await lib.graphql(context, 'query Validate { account { id } }');
        }
    }
};
