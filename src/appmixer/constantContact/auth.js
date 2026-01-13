'use strict';

const getBasicAuthHeader = (context) => {
    const credentials = `${context.clientId}:${context.clientSecret}`;
    return Buffer.from(credentials).toString('base64');
};

module.exports = {
    type: 'oauth2',

    definition: {

        scope: [
            'contact_data',
            'campaign_data',
            'account_read',
            'offline_access'
        ],

        accountNameFromProfileInfo: context => {
            return context.profileInfo.contact_email || context.profileInfo.email || context.profileInfo.account_id;
        },

        emailFromProfileInfo: context => context.profileInfo.contact_email || context.profileInfo.email,

        authUrl: (context) => {
            const state = context.ticket;
            const scope = context.scope.join(' ');

            // Use the correct authorization endpoint as specified in the documentation
            const authorizationUrl = new URL('https://authz.constantcontact.com/oauth2/default/v1/authorize');
            authorizationUrl.searchParams.set('client_id', context.clientId);
            authorizationUrl.searchParams.set('redirect_uri', context.callbackUrl);
            authorizationUrl.searchParams.set('response_type', 'code');
            authorizationUrl.searchParams.set('scope', scope);
            authorizationUrl.searchParams.set('state', state);

            return authorizationUrl.toString();
        },

        requestAccessToken: async (context) => {
            // Use the exact endpoint and method from Constant Contact documentation
            const options = {
                method: 'POST',
                url: 'https://authz.constantcontact.com/oauth2/default/v1/token',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${getBasicAuthHeader(context)}`
                },
                data: {
                    code: context.authorizationCode,
                    redirect_uri: context.callbackUrl,
                    grant_type: 'authorization_code'
                }
            };

            const { data } = await context.httpRequest(options);

            // Calculate expiration date based on expires_in seconds
            const expiresIn = parseInt(data.expires_in, 10) || 28800; // Default to 8 hours as per CC docs
            const accessTokenExpDate = new Date();
            accessTokenExpDate.setTime(accessTokenExpDate.getTime() + expiresIn * 1000);

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                accessTokenExpDate
            };
        },

        refreshAccessToken: async (context) => {
            const options = {
                method: 'POST',
                url: 'https://authz.constantcontact.com/oauth2/default/v1/token',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${getBasicAuthHeader(context)}`
                },
                data: {
                    refresh_token: context.refreshToken,
                    grant_type: 'refresh_token'
                }
            };

            const { data } = await context.httpRequest(options);

            // Calculate expiration date for the new access token
            const expiresIn = parseInt(data.expires_in, 10) || 28800;
            const accessTokenExpDate = new Date();
            accessTokenExpDate.setTime(accessTokenExpDate.getTime() + expiresIn * 1000);

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                accessTokenExpDate
            };
        },

        requestProfileInfo: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.cc.email/v3/account/summary',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${context.accessToken}`
                }
            });

            return response.data;
        },

        validateAccessToken: async (context) => {
            try {
                await context.httpRequest({
                    method: 'GET',
                    url: 'https://api.cc.email/v3/account/summary',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${context.accessToken}`
                    }
                });
                return true;
            } catch (error) {
                // If we get a 401 Unauthorized, the token is invalid
                if (error.response && error.response.status === 401) {
                    return false;
                }
                // Re-throw other errors
                throw error;
            }
        }
    }
};
