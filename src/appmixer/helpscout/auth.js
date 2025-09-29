'use strict';

module.exports = {
    type: 'oauth2',
    definition: () => {
        return {
            accountNameFromProfileInfo: (context) => context.profileInfo.email,

            emailFromProfileInfo: (context) => context.profileInfo.email,

            // Authorization URL
            authUrl: (context) => {
                const params = new URLSearchParams({
                    client_id: context.clientId,
                    redirect_uri: context.callbackUrl,
                    response_type: 'code',
                    state: context.ticket
                });
                return `https://secure.helpscout.net/authentication/authorizeClientApplication?${params}`;
            },

            // Exchange authorization code for access token
            requestAccessToken: async (context) => {
                const response = await context.httpRequest({
                    method: 'POST',
                    url: 'https://api.helpscout.net/v2/oauth2/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: {
                        code: context.authorizationCode,
                        client_id: context.clientId,
                        client_secret: context.clientSecret,
                        grant_type: 'authorization_code'
                    }
                });

                return {
                    accessToken: response.data.access_token,
                    accessTokenExpDate: new Date(Date.now() + response.data.expires_in * 1000),
                    refreshToken: response.data.refresh_token
                };
            },

            // Get user profile
            requestProfileInfo: async (context) => {
                const response = await context.httpRequest({
                    method: 'GET',
                    url: 'https://api.helpscout.net/v2/users/me',
                    headers: {
                        'Authorization': `Bearer ${context.accessToken}`,
                        'Accept': 'application/json'
                    }
                });
                return response.data;
            },

            // Refresh expired access token
            refreshAccessToken: async (context) => {
                const response = await context.httpRequest({
                    method: 'POST',
                    url: 'https://api.helpscout.net/v2/oauth2/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: {
                        client_id: context.clientId,
                        client_secret: context.clientSecret,
                        refresh_token: context.refreshToken,
                        grant_type: 'refresh_token'
                    }
                });

                return {
                    accessToken: response.data.access_token,
                    accessTokenExpDate: new Date(Date.now() + response.data.expires_in * 1000),
                    refreshToken: response.data.refresh_token
                };
            },

            // Validate access token
            validateAccessToken: async (context) => {
                const response = await context.httpRequest({
                    method: 'GET',
                    url: 'https://api.helpscout.net/v2/users/me',
                    headers: {
                        'Authorization': `Bearer ${context.accessToken}`,
                        'Accept': 'application/json'
                    }
                });
                return !!response.data.id;
            }
        };
    }
};
