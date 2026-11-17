'use strict';

const lib = require('./lib');

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
                tooltip: 'Generate an API key in Qlik Cloud under Profile settings &gt; API keys. Your tenant admin must grant you the <b>Manage API keys</b> permission, and should raise the maximum API key expiry (24 hours by default) so the connection keeps working.'
            }
        },

        accountNameFromProfileInfo: (context) => {

            const profile = context.profileInfo || {};
            const name = profile.email || profile.name || profile.id;
            return name + ' (' + profile.tenantHost + ')';
        },

        requestProfileInfo: async (context) => {

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

            await lib.apiRequest(context, { path: '/api/v1/users/me' });
            return true;
        }
    }
};
