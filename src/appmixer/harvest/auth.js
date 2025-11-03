'use strict';

module.exports = {

    type: 'oauth2',

    definition: () => {

        return {

            accountNameFromProfileInfo: (context) => {
                return `${context.profileInfo.user.email}`;
            },

            authUrl: (context) => {
                return 'https://id.getharvest.com/oauth2/authorize?' +
                    `client_id=${encodeURIComponent(context.clientId)}&` +
                    `redirect_uri=${encodeURIComponent(context.callbackUrl)}&` +
                    'response_type=code&' +
                    `state=${encodeURIComponent(context.ticket)}`;
            },

            requestAccessToken: async (context) => {
                const body = {
                    'grant_type': 'authorization_code',
                    'code': context.authorizationCode,
                    'redirect_uri': context.callbackUrl,
                    'client_id': context.clientId,
                    'client_secret': context.clientSecret
                };

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: 'https://id.getharvest.com/api/v2/oauth2/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Appmixer (auth@appmixer.ai)'
                    },
                    data: body
                });

                const expDate = new Date();
                expDate.setTime(expDate.getTime() + (data.expires_in * 1000));

                return {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    accessTokenExpDate: expDate
                };
            },

            requestProfileInfo: async (context) => {
                const { data } = await context.httpRequest({
                    method: 'GET',
                    url: 'https://id.getharvest.com/api/v2/accounts',
                    headers: {
                        'Authorization': `Bearer ${context.accessToken}`,
                        'User-Agent': 'Appmixer (auth@appmixer.ai)'
                    }
                });

                const accountId = data.accounts[0].id;

                console.log('account data', data);

                return {
                    ...data,
                    accountId
                };
            },

            validateAccessToken: 'https://id.getharvest.com/api/v2/accounts',

            refreshAccessToken: async (context) => {
                const body = {
                    'grant_type': 'refresh_token',
                    'refresh_token': context.refreshToken,
                    'client_id': context.clientId,
                    'client_secret': context.clientSecret
                };

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: 'https://id.getharvest.com/api/v2/oauth2/token',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Appmixer (auth@appmixer.ai)'
                    },
                    data: body
                });

                const expDate = new Date();
                expDate.setTime(expDate.getTime() + (data.expires_in * 1000));

                return {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    accessTokenExpDate: expDate
                };
            }
        };
    }
};
