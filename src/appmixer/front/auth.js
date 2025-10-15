'use strict';

module.exports = {

    type: 'oauth2',

    definition: () => {

        return {
            authUrl: (context) => {
                const callbackUrl = context.callbackUrl.replace(/^http:/, 'https:');
                return 'https://app.frontapp.com/oauth/authorize?' +
                    `client_id=${encodeURIComponent(context.clientId)}&` +
                    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
                    'response_type=code&' +
                    `state=${encodeURIComponent(context.ticket)}`;
            },

            requestAccessToken: async (context) => {
                const basicToken = Buffer.from(`${context.clientId}:${context.clientSecret}`).toString('base64');

                const body = {
                    'grant_type': 'authorization_code',
                    'code': context.authorizationCode,
                    'redirect_uri': context.callbackUrl
                };

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: 'https://app.frontapp.com/oauth/token',
                    headers: {
                        Authorization: `Basic ${basicToken}`
                    },
                    data: body
                });

                const expDate = new Date();
                expDate.setTime(expDate.getTime() + (data.expires_at * 1000));

                return {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    accessTokenExpDate: expDate
                };
            },

            requestProfileInfo: async (context) => {
                const { data } = await context.httpRequest({
                    method: 'GET',
                    url: 'https://api2.frontapp.com/me',
                    headers: {
                        Authorization: `Bearer ${context.accessToken}`,
                        accept: 'application/json'
                    }
                });

                return data;
            },

            accountNameFromProfileInfo: 'name',

            validateAccessToken: {
                method: 'GET',
                url: 'https://api2.frontapp.com/me',
                headers: {
                    Authorization: 'Bearer {{accessToken}}',
                    accept: 'application/json'
                }
            },

            refreshAccessToken: async (context) => {
                const basicToken = Buffer.from(`${context.clientId}:${context.clientSecret}`).toString('base64');
                const body = {
                    'grant_type': 'refresh_token',
                    'refresh_token': context.refreshToken
                };

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: 'https://app.frontapp.com/oauth/token',
                    headers: {
                        Authorization: `Basic ${basicToken}`
                    },
                    data: body
                });

                const expDate = new Date();
                expDate.setTime(expDate.getTime() + (data.expires_at * 1000));

                return {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    accessTokenExpDate: expDate
                };
            }
        };
    }
};
