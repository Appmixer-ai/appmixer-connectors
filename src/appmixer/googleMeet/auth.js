'use strict';

module.exports = {
    type: 'oauth2',
    definition: () => {
        return {
            clientId: process.env.GOOGLE_MEETS_CLIENT_ID,
            clientSecret: process.env.GOOGLE_MEETS_CLIENT_SECRET,

            scope: [
                'https://www.googleapis.com/auth/meetings.space.created',
                'https://www.googleapis.com/auth/meetings.space.readonly',
                'https://www.googleapis.com/auth/meetings.space.settings'
            ],

            accountNameFromProfileInfo: (context) => {
                return context.profileInfo.email;
            },

            emailFromProfileInfo: (context) => {
                return context.profileInfo.email;
            },

            authUrl: (context) => {
                const params = new URLSearchParams({
                    client_id: process.env.GOOGLE_MEETS_CLIENT_ID,
                    redirect_uri: context.callbackUrl,
                    response_type: 'code',
                    scope: context.scope.join(' '),
                    state: context.ticket,
                    access_type: 'offline',
                    approval_prompt: 'force'
                }).toString();

                return `https://accounts.google.com/o/oauth2/auth?${params}`;
            },

            requestAccessToken: async (context) => {
                const data = {
                    code: context.authorizationCode,
                    client_id: process.env.GOOGLE_MEETS_CLIENT_ID,
                    client_secret: process.env.GOOGLE_MEETS_CLIENT_SECRET,
                    redirect_uri: context.callbackUrl,
                    grant_type: 'authorization_code'
                };

                const response = await context.httpRequest({
                    method: 'POST',
                    url: 'https://oauth2.googleapis.com/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data
                });

                return {
                    accessToken: response.data.access_token,
                    accessTokenExpDate: new Date(Date.now() + response.data.expires_in * 1000),
                    refreshToken: response.data.refresh_token
                };
            },

            requestProfileInfo: async (context) => {
                const response = await context.httpRequest({
                    method: 'GET',
                    url: 'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers: {
                        Authorization: `Bearer ${context.accessToken}`
                    }
                });

                if (!response.data) {
                    throw new Error('Failed to retrieve profile info');
                }

                return response.data;
            },

            refreshAccessToken: async (context) => {
                const data = {
                    client_id: process.env.GOOGLE_MEETS_CLIENT_ID,
                    client_secret: process.env.GOOGLE_MEETS_CLIENT_SECRET,
                    refresh_token: context.refreshToken,
                    grant_type: 'refresh_token'
                };

                const response = await context.httpRequest({
                    method: 'POST',
                    url: 'https://oauth2.googleapis.com/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data
                });

                return {
                    accessToken: response.data.access_token,
                    accessTokenExpDate: new Date(Date.now() + response.data.expires_in * 1000)
                };
            },

            validateAccessToken: async (context) => {
                const response = await context.httpRequest({
                    method: 'GET',
                    url: 'https://www.googleapis.com/oauth2/v2/tokeninfo',
                    params: {
                        access_token: context.accessToken
                    }
                });

                if (response.data.expires_in) {
                    return !!response.data.expires_in;
                }

                return false;
            }
        };
    }
};
