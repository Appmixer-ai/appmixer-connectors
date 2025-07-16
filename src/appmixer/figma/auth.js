'use strict';

const getBasicAuthHeader = (context) => {
    const credentials = `${context.clientId}:${context.clientSecret}`;
    return Buffer.from(credentials).toString('base64');
};

module.exports = {
    type: 'oauth2',

    definition: {

        scope: [
            'current_user:read',
            'file_comments:read',
            'file_comments:write',
            'file_content:read',
            'file_dev_resources:read',
            'file_dev_resources:write',
            'file_metadata:read',
            'file_variables:read',
            'file_versions:read',
            'library_assets:read',
            'library_content:read',
            'projects:read',
            'team_library_content:read',
            'webhooks:read',
            'webhooks:write'
        ],

        accountNameFromProfileInfo: context => context.profileInfo.email,

        emailFromProfileInfo: context => context.profileInfo.email,

        authUrl: (context) => {
            const state = context.ticket;

            const authorizationUrl = new URL('https://www.figma.com/oauth');
            authorizationUrl.searchParams.set('client_id', context.clientId);
            authorizationUrl.searchParams.set('redirect_uri', context.callbackUrl);
            authorizationUrl.searchParams.set('response_type', 'code');
            authorizationUrl.searchParams.set('scope', context.scope.join(' '));
            authorizationUrl.searchParams.set('state', state);

            return authorizationUrl.toString();
        },

        requestAccessToken: async (context) => {
            const options = {
                method: 'POST',
                url: 'https://api.figma.com/v1/oauth/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${getBasicAuthHeader(context)}`
                },
                data: {
                    code: context.authorizationCode,
                    redirect_uri: context.callbackUrl,
                    client_id: context.clientId,
                    client_secret: context.clientSecret,
                    grant_type: 'authorization_code'
                }
            };
            const { data } = await context.httpRequest(options);

            let accessTokenExpDate = new Date();
            accessTokenExpDate.setTime(accessTokenExpDate.getTime() + (data.expires_in || 3600) * 1000);

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                accessTokenExpDate
            };
        },

        refreshAccessToken: 'https://api.figma.com/v1/oauth/refresh',


        requestProfileInfo: {
            method: 'GET',
            url: 'https://api.figma.com/v1/me',
            headers: {
                Authorization: 'Bearer {{accessToken}}'
            }
        },

        validateAccessToken: async (context) => {
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.figma.com/v1/me',
                headers: {
                    Authorization: `Bearer ${context.accessToken}`
                }
            });
            return true;
        }
    }
};
