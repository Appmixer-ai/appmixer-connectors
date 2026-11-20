'use strict';

const lib = require('./lib');

// SuperOffice CRM Online: OAuth 2.0 authorization code flow through SuperID (OpenID Connect).
// The only scope is "openid" and it grants access to every API the signed-in user may use.
// One client ID and secret serve every tenant of an environment; the tenant (CustNNNNN) the user
// signs in to comes from the id_token and its API host from the public tenant state endpoint.
// The service configuration holds clientId, clientSecret and optionally environment
// ("online" by default, "sod" for development or "qaonline" for stage).

const tokenRequest = async (context, form) => {

    const { data } = await context.httpRequest({
        method: 'POST',
        url: lib.getLoginOrigin(context) + '/login/common/oauth/tokens',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        data: new URLSearchParams(form).toString()
    });
    return data;
};

const expiresAt = (data) => new Date(Date.now() + (Number(data.expires_in) || 3600) * 1000);

module.exports = {

    type: 'oauth2',

    definition: {

        scope: ['openid'],

        scopeDelimiter: ' ',

        authUrl: (context) => {

            const params = new URLSearchParams({
                client_id: context.clientId,
                scope: 'openid',
                redirect_uri: context.callbackUrl,
                response_type: 'code',
                state: context.ticket
            });
            return lib.getLoginOrigin(context) + '/login/common/oauth/authorize?' + params.toString();
        },

        requestAccessToken: async (context) => {

            const data = await tokenRequest(context, {
                client_id: context.clientId,
                client_secret: context.clientSecret,
                code: context.authorizationCode,
                redirect_uri: context.callbackUrl,
                grant_type: 'authorization_code'
            });

            const tenantId = lib.tenantFromIdToken(data.id_token);
            if (!tenantId) {
                throw new Error('SuperOffice did not say which tenant the account belongs to.');
            }

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                accessTokenExpDate: expiresAt(data),
                tenantId
            };
        },

        refreshAccessToken: async (context) => {

            const data = await tokenRequest(context, {
                client_id: context.clientId,
                client_secret: context.clientSecret,
                refresh_token: context.refreshToken,
                grant_type: 'refresh_token'
            });

            const result = {
                accessToken: data.access_token,
                accessTokenExpDate: expiresAt(data)
            };
            // Refresh tokens are long-lived and reused; keep a new one if SuperOffice sends it.
            if (data.refresh_token) {
                result.refreshToken = data.refresh_token;
            }
            return result;
        },

        requestProfileInfo: async (context) => {

            const tenantId = lib.getTenantId(context);
            const principal = await lib.request(context, { path: '/User/currentPrincipal' });
            return {
                tenantId,
                associateId: principal.AssociateId,
                personId: principal.PersonId,
                fullName: principal.FullName,
                email: principal.EMailAddress,
                userName: principal.UserName
            };
        },

        accountNameFromProfileInfo: (context) => {

            const profile = context.profileInfo || {};
            const name = profile.fullName || profile.email || profile.userName || 'SuperOffice';
            return name + ' (' + profile.tenantId + ')';
        },

        emailFromProfileInfo: 'email',

        validateAccessToken: async (context) => {

            await lib.request(context, { path: '/User/currentPrincipal' });
            return true;
        }
    }
};
