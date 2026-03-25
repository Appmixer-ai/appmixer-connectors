'use strict';

/**
 * OAuth 2.1 + PKCE authentication for Asana MCP server.
 *
 * Asana MCP uses a separate "MCP app" type created in the Asana developer console.
 * Tokens issued for MCP apps only work with the MCP server — they cannot be used
 * with the standard Asana API.
 *
 * Key differences from standard Asana OAuth:
 * - App type must be "MCP app" in developer console
 * - The `resource` parameter is included in the auth URL to specify MCP server
 * - No scopes are needed (MCP apps don't use scopes)
 * - PKCE with S256 is required
 *
 * @see https://developers.asana.com/docs/integrating-with-asanas-mcp-server
 */
module.exports = {

    type: 'oauth2',

    definition: () => {

        let profileInfo;

        return {

            accountNameFromProfileInfo: context => {

                return context.profileInfo?.email
                    || context.profileInfo?.name
                    || context.profileInfo?.gid
                    || 'Asana MCP User';
            },

            // MCP apps don't use scopes
            scope: [],

            authUrl(context) {

                return 'https://app.asana.com/-/oauth_authorize?' +
                    `client_id=${encodeURIComponent(context.clientId)}&` +
                    `redirect_uri=${encodeURIComponent(context.callbackUrl)}&` +
                    'response_type=code&' +
                    `resource=${encodeURIComponent('https://mcp.asana.com/v2')}&` +
                    `state=${encodeURIComponent(context.ticket)}`;
            },

            async requestAccessToken(context) {

                const tokenUrl = 'https://app.asana.com/-/oauth_token?' +
                    'grant_type=authorization_code&' +
                    `code=${context.authorizationCode}&` +
                    `redirect_uri=${encodeURIComponent(context.callbackUrl)}&` +
                    `client_id=${context.clientId}&` +
                    `client_secret=${context.clientSecret}`;

                const { data: result } = await context.httpRequest({
                    method: 'POST',
                    url: tokenUrl,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                profileInfo = result.data;

                const newDate = new Date();
                newDate.setTime(newDate.getTime() + (result.expires_in * 1000));

                return {
                    accessToken: result.access_token,
                    refreshToken: result.refresh_token,
                    accessTokenExpDate: newDate
                };
            },

            requestProfileInfo: () => {

                return profileInfo || {};
            },

            async refreshAccessToken(context) {

                const tokenUrl = 'https://app.asana.com/-/oauth_token?' +
                    'grant_type=refresh_token&' +
                    `refresh_token=${context.refreshToken}&` +
                    `redirect_uri=${encodeURIComponent(context.callbackUrl)}&` +
                    `client_id=${context.clientId}&` +
                    `client_secret=${context.clientSecret}`;

                const { data: result } = await context.httpRequest({
                    method: 'POST',
                    url: tokenUrl,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                profileInfo = result.data;

                const newDate = new Date();
                newDate.setTime(newDate.getTime() + (result.expires_in * 1000));

                return {
                    accessToken: result.access_token,
                    accessTokenExpDate: newDate
                };
            },

            validateAccessToken: {
                method: 'GET',
                url: 'https://app.asana.com/api/1.0/users/me',
                auth: {
                    bearer: '{{accessToken}}'
                }
            }
        };
    }
};
