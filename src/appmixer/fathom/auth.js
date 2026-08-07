'use strict';

// Fathom public API — multitenant OAuth2 (scope `public_api`).
//
// Endpoints (base https://api.fathom.ai/external/v1):
//   authorize: https://fathom.video/external/v1/oauth2/authorize
//   token:     https://api.fathom.ai/external/v1/oauth2/token
//
// NOTE: the authorization URL is not documented by Fathom; it is taken from the
// official `fathom-typescript` SDK (getAuthorizationUrl). It should be confirmed
// with Fathom before this connector is published.
//
// IMPORTANT: Fathom refresh tokens are single-use and rotate on every refresh —
// the new refresh token returned by the token endpoint MUST be persisted, which
// is why refreshAccessToken below returns the fresh `refreshToken`.

const API_BASE_URL = 'https://api.fathom.ai/external/v1';
const AUTHORIZE_URL = 'https://fathom.video/external/v1/oauth2/authorize';
const TOKEN_URL = `${API_BASE_URL}/oauth2/token`;

module.exports = {

    type: 'oauth2',

    definition: initData => {

        return {

            scope: ['public_api'],

            accountNameFromProfileInfo: function(context) {
                const recordedBy = context.profileInfo && context.profileInfo.recorded_by;
                return (recordedBy && (recordedBy.email || recordedBy.name)) || 'Fathom account';
            },

            authUrl: function(context) {
                const params = new URLSearchParams({
                    client_id: initData.clientId,
                    redirect_uri: context.callbackUrl,
                    response_type: 'code',
                    scope: context.scope.join(' '),
                    state: context.ticket
                }).toString();

                return `${AUTHORIZE_URL}?${params}`;
            },

            requestAccessToken: async function(context) {

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: TOKEN_URL,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: new URLSearchParams({
                        grant_type: 'authorization_code',
                        code: context.authorizationCode,
                        client_id: initData.clientId,
                        client_secret: initData.clientSecret,
                        redirect_uri: context.callbackUrl
                    }).toString()
                });

                return {
                    accessToken: data.access_token,
                    accessTokenExpDate: new Date(Date.now() + data.expires_in * 1000),
                    refreshToken: data.refresh_token
                };
            },

            refreshAccessToken: async function(context) {

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: TOKEN_URL,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: context.refreshToken,
                        client_id: initData.clientId,
                        client_secret: initData.clientSecret,
                        redirect_uri: context.callbackUrl
                    }).toString()
                });

                return {
                    accessToken: data.access_token,
                    accessTokenExpDate: new Date(Date.now() + data.expires_in * 1000),
                    // Fathom rotates the refresh token on every refresh — always persist the new one.
                    refreshToken: data.refresh_token
                };
            },

            // There is no /me endpoint. GET /meetings?limit=1 is the cheapest authorized call
            // and lets us derive a human-readable account name from the recorded_by user.
            requestProfileInfo: async function(context) {
                const { data } = await context.httpRequest({
                    method: 'GET',
                    url: `${API_BASE_URL}/meetings`,
                    headers: { Authorization: `Bearer ${context.accessToken}` },
                    params: { limit: 1 }
                });

                const items = (data && data.items) || [];
                return items[0] || {};
            },

            validateAccessToken: async function(context) {
                await context.httpRequest({
                    method: 'GET',
                    url: `${API_BASE_URL}/meetings`,
                    headers: { Authorization: `Bearer ${context.accessToken}` },
                    params: { limit: 1 }
                });
                return true;
            }
        };
    }
};
