'use strict';

const lib = require('./lib');

/**
 * The account uses either an API key or an OAuth client (machine-to-machine), never both.
 * Checked before any request, so a half-filled form gets a clear message instead of a 401.
 * @param {object} context
 */
const checkCredentials = (context) => {

    const { apiKey, clientId, clientSecret } = lib.credentials(context);
    if (apiKey && (clientId || clientSecret)) {
        throw new Error('Fill in either the API Key, or the Client ID and Client Secret of an OAuth client, not both.');
    }
    if (!apiKey && !clientId && !clientSecret) {
        throw new Error('Fill in the API Key, or the Client ID and Client Secret of an OAuth client.');
    }
    if (!apiKey && (!clientId || !clientSecret)) {
        throw new Error('An OAuth client needs both the Client ID and the Client Secret.');
    }
};

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            tenant: {
                type: 'text',
                name: 'Tenant Hostname',
                tooltip: 'The hostname of your Qlik Cloud tenant, for example <code>acme.eu.qlikcloud.com</code>.'
            },
            apiKey: {
                type: 'password',
                name: 'API Key',
                tooltip: 'Either an API key, or the Client ID and Client Secret below. Generate an API key in Qlik Cloud under Profile settings &gt; API keys. Your tenant admin must grant you the <b>Manage API keys</b> permission, and should raise the maximum API key expiry (24 hours by default) so the connection keeps working. Leave empty when you use an OAuth client.'
            },
            clientId: {
                type: 'text',
                name: 'OAuth Client ID',
                tooltip: 'For unattended flows, instead of an API key: the Client ID of a Qlik Cloud OAuth client (Administration &gt; OAuth, client type <b>Web</b>, <b>Allow Machine-to-Machine (M2M)</b> enabled, and the scopes your flows need, for example <code>user_default</code>). The connector requests and renews the access tokens itself, so the connection does not stop when a key expires. Leave empty when you use an API key.'
            },
            clientSecret: {
                type: 'password',
                name: 'OAuth Client Secret',
                tooltip: 'The Client Secret of the OAuth client, shown once when the client is created. Leave empty when you use an API key.'
            }
        },

        accountNameFromProfileInfo: (context) => {

            const profile = context.profileInfo || {};
            const name = profile.email || profile.name || profile.id;
            return name + ' (' + profile.tenantHost + ')';
        },

        requestProfileInfo: async (context) => {

            checkCredentials(context);
            // GET /users/me answers with a redirect to /users/{id} on the same tenant.
            const { data } = await lib.apiRequest(context, { path: '/api/v1/users/me' });
            return {
                id: data.id,
                name: data.name,
                email: data.email,
                tenantId: data.tenantId,
                tenantHost: lib.tenantOrigin(context.tenant).replace('https://', '')
            };
        },

        validate: async (context) => {

            checkCredentials(context);
            await lib.apiRequest(context, { path: '/api/v1/users/me' });
            return true;
        }
    }
};
