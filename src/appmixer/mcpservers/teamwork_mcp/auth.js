'use strict';

const AUTH_URL = 'https://www.teamwork.com/launchpad/login';
const TOKEN_URL = 'https://www.teamwork.com/launchpad/v1/token.json';

/**
 * Teamwork.com OAuth for the MCP server, so the module works without the Teamwork connector installed.
 * Same Teamwork launchpad flow as appmixer.teamwork, but its own service (appmixer:mcpservers:teamwork_mcp)
 * with its own service configuration and accounts.
 */
module.exports = {

    type: 'oauth2',

    definition: () => {

        // The site API endpoint comes with the token response and is needed for the profile request.
        // Kept per definition() call, not per module, so concurrent connects do not see each other's site.
        let accountURL = null;

        return {

            authUrl: AUTH_URL,

            accountNameFromProfileInfo: 'emailAddress',

            requestAccessToken: async context => {

                const response = await context.httpRequest({
                    method: 'POST',
                    url: TOKEN_URL,
                    headers: { 'Content-Type': 'application/json' },
                    data: {
                        code: context.authorizationCode,
                        redirect_uri: context.callbackUrl,
                        client_id: context.clientId,
                        client_secret: context.clientSecret
                    }
                });

                accountURL = response.data?.installation?.apiEndPoint;
                if (!accountURL) {
                    throw new Error('Teamwork did not return the site API endpoint.');
                }

                return {
                    accessToken: response.data['access_token']
                };
            },

            requestProfileInfo: async context => {

                const response = await context.httpRequest({
                    method: 'GET',
                    url: new URL('/me.json', accountURL).toString(),
                    headers: { 'Authorization': `Bearer ${context.accessToken}` }
                });

                return {
                    emailAddress: response.data.person['email-address'],
                    accountURL
                };
            },

            validateAccessToken: async context => {

                await context.httpRequest({
                    method: 'GET',
                    url: new URL('/me.json', context.profileInfo.accountURL).toString(),
                    headers: { 'Authorization': `Bearer ${context.accessToken}` }
                });
            }
        };
    }
};
