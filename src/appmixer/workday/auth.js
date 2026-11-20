'use strict';

const lib = require('./lib');

// Workday has no global OAuth app: every customer registers an API client in their
// own tenant. This module uses "Register API Client for Integrations": the admin
// generates a non-expiring refresh token for an integration system user, and the
// connector exchanges it for an access token at https://{host}/ccx/oauth2/{tenant}/token.
// Calls then run with that user's security permissions.
const DEFAULT_TOKEN_LIFETIME = 3600;

module.exports = {

    type: 'pwd',

    definition: {

        auth: {
            host: {
                type: 'text',
                name: 'Workday Host',
                tooltip: 'Hostname of your tenant from the <b>View API Clients</b> report, e.g. <code>wd2-impl-services1.workday.com</code>. Hostname only, without https:// or a path.'
            },
            tenant: {
                type: 'text',
                name: 'Tenant',
                tooltip: 'Your Workday tenant name, e.g. <code>acme</code> or <code>acme_dpt1</code> (the last segment of the Workday REST API Endpoint).'
            },
            clientId: {
                type: 'text',
                name: 'Client ID',
                tooltip: 'Client ID of an API client registered with the <b>Register API Client for Integrations</b> task.'
            },
            clientSecret: {
                type: 'password',
                name: 'Client Secret',
                tooltip: 'Client secret of the API client (shown once when the client is registered).'
            },
            refreshToken: {
                type: 'password',
                name: 'Refresh Token',
                tooltip: 'Generate it in <b>View API Clients → API Clients for Integrations → Manage Refresh Tokens for Integrations</b> for the integration system user the connector should act as.'
            }
        },

        accountNameFromProfileInfo: context => {

            return `${context.tenant} (${context.host})`;
        },

        validate: async context => {

            // Throws on an invalid host or tenant before any request is made.
            const url = lib.tokenUrl(context.host, context.tenant);
            const basic = Buffer.from(`${context.clientId}:${context.clientSecret}`).toString('base64');

            const { data } = await context.httpRequest({
                method: 'POST',
                url,
                headers: {
                    'Authorization': `Basic ${basic}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: context.refreshToken
                }).toString()
            });

            if (!data || !data.access_token) {
                throw new Error('Workday did not return an access token. Check the client ID, secret and refresh token.');
            }

            // Workday may answer expires_in -1 when the client does not enforce the
            // 60 minute access token expiry; refresh hourly in that case.
            const expiresIn = Number(data.expires_in);
            return {
                token: data.access_token,
                expires: expiresIn > 0 ? expiresIn : DEFAULT_TOKEN_LIFETIME
            };
        }
    }
};
