'use strict';

module.exports = {
    type: 'oauth2',

    definition: initData => {

        return {

            accountNameFromProfileInfo: function(context) {
                return context.profileInfo.login;
            },

            emailFromProfileInfo: function(context) {
                return context.profileInfo.login;
            },

            authUrl: function(context) {
                const params = new URLSearchParams({
                    client_id: initData.clientId,
                    redirect_uri: context.callbackUrl,
                    response_type: 'code',
                    scope: context.scope.join(' '),
                    state: context.ticket,
                    access_type: 'offline',
                    prompt: 'consent'
                }).toString();

                return `https://account.box.com/api/oauth2/authorize?${params}`;
            },

            requestAccessToken: async function(context) {

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: 'https://api.box.com/oauth2/token',
                    data: {
                        code: context.authorizationCode,
                        client_id: initData.clientId,
                        client_secret: initData.clientSecret,
                        redirect_uri: context.callbackUrl,
                        grant_type: 'authorization_code'
                    }
                });

                return {
                    accessToken: data.access_token,
                    accessTokenExpDate: new Date(Date.now() + data.expires_in * 1000),
                    refreshToken: data.refresh_token
                };
            },

            requestProfileInfo: async function(context) {
                const response = await context.httpRequest({
                    method: 'GET',
                    url: 'https://api.box.com/2.0/users/me',
                    headers: {
                        Authorization: `Bearer ${context.accessToken}`
                    }
                });

                if (!response.data) {
                    throw new Error('Failed to retrieve profile info');
                }

                return response.data;
            },

            refreshAccessToken: async function(context) {

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: 'https://api.box.com/oauth2/token',
                    data: {
                        client_id: initData.clientId,
                        client_secret: initData.clientSecret,
                        refresh_token: context.refreshToken,
                        grant_type: 'refresh_token'
                    }
                });

                return {
                    accessToken: data.access_token,
                    accessTokenExpDate: new Date(Date.now() + data.expires_in * 1000),
                    refreshToken: data.refresh_token
                };
            },

            validateAccessToken: async function(context) {
                const { data } = await context.httpRequest({
                    method: 'GET',
                    url: 'https://api.box.com/2.0/users/me',
                    headers: {
                        Authorization: `Bearer ${context.accessToken}`
                    }
                });

                return !!data?.id;
            }
        };
    }
};
