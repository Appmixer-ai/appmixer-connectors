'use strict';

const API_VERSION = 'v25.0';

module.exports = {

    type: 'oauth2',

    definition: {

        scope: ['public_profile', 'email'],

        authUrl: context => {

            const params = {
                'client_id': context.clientId,
                'redirect_uri': context.callbackUrl,
                'scope': context.scope.join(', '),
                'state': context.ticket
            };
            return `https://www.facebook.com/${API_VERSION}/dialog/oauth?` + new URLSearchParams(params).toString();
        },

        requestAccessToken: async context => {

            const params = {
                'client_id': context.clientId,
                'redirect_uri': context.callbackUrl,
                'client_secret': context.clientSecret,
                'code': context.authorizationCode
            };

            const url = `https://graph.facebook.com/${API_VERSION}/oauth/access_token`;
            const response = await context.httpRequest.get(url + '?' + new URLSearchParams(params).toString());
            const newDate = new Date();
            newDate.setTime(newDate.getTime() + (response.data['expires_in'] * 1000));
            return {
                accessToken: response.data['access_token'],
                accessTokenExpDate: newDate
            };
        },

        accountNameFromProfileInfo: context => {

            return context.profileInfo['name'] || context.profileInfo['id'].toString();
        },

        requestProfileInfo: async context => {

            const url = `https://graph.facebook.com/${API_VERSION}/me?access_token=${context.accessToken}`;
            const response = await context.httpRequest.get(url);
            return response.data;
        },

        refreshAccessToken: async context => {

            const params = {
                'access_token': context.accessToken,
                'client_id': context.clientId,
                'client_secret': context.clientSecret,
                'fb_exchange_token': context.accessToken,
                'grant_type': 'fb_exchange_token'
            };

            const url = `https://graph.facebook.com/${API_VERSION}/oauth/access_token`;

            const response = await context.httpRequest.get(url + '?' + new URLSearchParams(params).toString());
            if (response.data.error) {
                throw new context.InvalidTokenError(response.data.error.message);
            }
            const newDate = new Date();
            newDate.setTime(newDate.getTime() + (response.data['expires_in'] * 1000));
            return {
                accessToken: response.data['access_token'],
                accessTokenExpDate: newDate
            };
        },

        validateAccessToken: async context => {

            try {
                const url = `https://graph.facebook.com/${API_VERSION}/me?access_token=${context.accessToken}`;
                await context.httpRequest.get(url);
            } catch (err) {
                if (err.response?.data?.error?.type === 'OAuthException') {
                    throw new context.InvalidTokenError(err.response.data.error.message);
                }
                throw err;
            }
        }
    }
};
