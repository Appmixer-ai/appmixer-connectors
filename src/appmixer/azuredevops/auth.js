'use strict';

module.exports = {
    type: 'oauth2',
    definition: () => ({
        scope: [
            '499b84ac-1321-427f-aa17-267ca6975798/user_impersonation',
            'offline_access'
        ],

        pre: () => ({
            tenantId: {
                type: 'text',
                name: 'Tenant ID',
                tooltip: 'Optional. Your Azure Active Directory Tenant ID (e.g. <b>contoso.onmicrosoft.com</b> or a GUID). '
                    + 'Required when your Azure DevOps organization is attached to a specific tenant. '
                    + 'Leave empty to use the default <i>organizations</i> endpoint.'
            }
        }),

        authUrl: (context) => {
            const tenant = context.tenantId || 'organizations';
            const params = new URLSearchParams({
                client_id: context.clientId,
                redirect_uri: context.callbackUrl,
                response_type: 'code',
                scope: context.scope.join(' '),
                state: context.ticket,
                prompt: 'select_account'
            });
            return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;
        },

        requestAccessToken: async (context) => {
            const tenant = context.tenantId || 'organizations';
            const response = await context.httpRequest({
                method: 'POST',
                url: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: new URLSearchParams({
                    code: context.authorizationCode,
                    client_id: context.clientId,
                    client_secret: context.clientSecret,
                    redirect_uri: context.callbackUrl,
                    grant_type: 'authorization_code',
                    scope: context.scope.join(' ')
                }).toString()
            });

            return {
                accessToken: response.data.access_token,
                accessTokenExpDate: new Date(Date.now() + response.data.expires_in * 1000),
                refreshToken: response.data.refresh_token
            };
        },

        refreshAccessToken: async (context) => {
            const tenant = context.tenantId || 'organizations';
            const response = await context.httpRequest({
                method: 'POST',
                url: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: new URLSearchParams({
                    client_id: context.clientId,
                    client_secret: context.clientSecret,
                    refresh_token: context.refreshToken,
                    grant_type: 'refresh_token',
                    scope: context.scope.join(' ')
                }).toString()
            });

            return {
                accessToken: response.data.access_token,
                accessTokenExpDate: new Date(Date.now() + response.data.expires_in * 1000)
            };
        },

        requestProfileInfo: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1',
                headers: { Authorization: `Bearer ${context.accessToken}` }
            });
            return response.data;
        },

        accountNameFromProfileInfo: (context) => {
            return context.profileInfo.emailAddress || context.profileInfo.displayName;
        },

        validateAccessToken: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1',
                headers: { Authorization: `Bearer ${context.accessToken}` }
            });
            return !!response.data.id;
        }
    })
};
