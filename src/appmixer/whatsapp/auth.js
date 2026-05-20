'use strict';

const GRAPH_VERSION = 'v25.0';

module.exports = {

    type: 'oauth2',

    definition: {

        scope: [
            'whatsapp_business_messaging',
            'whatsapp_business_management'
        ],

        authUrl: context => {

            const params = {
                'client_id': context.clientId,
                'redirect_uri': context.callbackUrl,
                'scope': context.scope.join(','),
                'state': context.ticket
            };
            return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?` + new URLSearchParams(params).toString();
        },

        requestAccessToken: async context => {

            const params = {
                'client_id': context.clientId,
                'redirect_uri': context.callbackUrl,
                'client_secret': context.clientSecret,
                'code': context.authorizationCode
            };

            const url = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`;
            const response = await context.httpRequest.get(url + '?' + new URLSearchParams(params).toString());

            const expiresIn = response.data['expires_in'];
            const accessTokenExpDate = expiresIn
                ? new Date(Date.now() + expiresIn * 1000)
                : undefined;

            return {
                accessToken: response.data['access_token'],
                accessTokenExpDate
            };
        },

        accountNameFromProfileInfo: context => {

            return context.profileInfo['name'] || context.profileInfo['id'].toString();
        },

        requestProfileInfo: async context => {

            const url = `https://graph.facebook.com/${GRAPH_VERSION}/me?access_token=${context.accessToken}`;
            const response = await context.httpRequest.get(url);
            return response.data;
        },

        refreshAccessToken: async context => {

            const params = {
                'client_id': context.clientId,
                'client_secret': context.clientSecret,
                'grant_type': 'fb_exchange_token',
                'fb_exchange_token': context.accessToken
            };

            const url = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`;
            const response = await context.httpRequest.get(url + '?' + new URLSearchParams(params).toString());

            const expiresIn = response.data['expires_in'];
            const accessTokenExpDate = expiresIn
                ? new Date(Date.now() + expiresIn * 1000)
                : undefined;

            return {
                accessToken: response.data['access_token'],
                accessTokenExpDate
            };
        },

        validateAccessToken: async context => {

            try {
                const url = `https://graph.facebook.com/${GRAPH_VERSION}/me?access_token=${context.accessToken}`;
                await context.httpRequest.get(url);
                return true;
            } catch (err) {
                return false;
            }
        }
    }
};
