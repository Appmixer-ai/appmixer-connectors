'use strict';

module.exports = {
    type: 'oauth2',

    definition: {

        scope: [
            'MERCHANT_PROFILE_READ',
            'CUSTOMERS_READ',
            'CUSTOMERS_WRITE',
            'ORDERS_READ',
            'ORDERS_WRITE',
            'ITEMS_READ',
            'INVENTORY_READ'
        ],

        scopeDelimiter: ' ',

        accountNameFromProfileInfo: context => {

            return context.profileInfo.merchant?.business_name || context.profileInfo.merchant?.id;
        },

        authUrl: context => {

            const environment = context.config.environment || 'production';
            const baseUrl = environment === 'production'
                ? 'https://connect.squareup.com/oauth2'
                : 'https://connect.squareupsandbox.com/oauth2';

            return `${baseUrl}/authorize?response_type=code&client_id=${context.clientId}&scope=${context.scope.join(' ')}&redirect_uri=${context.callbackUrl}&state=${context.ticket}`;
        },

        requestAccessToken: async context => {

            const { clientId, clientSecret, authorizationCode } = context;
            const environment = context.config.environment || 'production';
            const baseUrl = environment === 'production'
                ? 'https://connect.squareup.com/oauth2'
                : 'https://connect.squareupsandbox.com/oauth2';

            const response = await context.httpRequest({
                method: 'POST',
                url: `${baseUrl}/token`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: authorizationCode,
                    grant_type: 'authorization_code',
                    redirect_uri: context.callbackUrl
                }
            });

            const data = response.data;
            let newDate = new Date();
            newDate.setTime(newDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days default

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                accessTokenExpDate: data.expires_at ? new Date(data.expires_at) : newDate
            };
        },

        refreshAccessToken: async context => {

            const { clientId, clientSecret, refreshToken } = context;
            const environment = context.config.environment || 'production';
            const baseUrl = environment === 'production'
                ? 'https://connect.squareup.com/oauth2'
                : 'https://connect.squareupsandbox.com/oauth2';

            const response = await context.httpRequest({
                method: 'POST',
                url: `${baseUrl}/token`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                }
            });

            const data = response.data;
            let newDate = new Date();
            newDate.setTime(newDate.getTime() + (30 * 24 * 60 * 60 * 1000));

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                accessTokenExpDate: data.expires_at ? new Date(data.expires_at) : newDate
            };
        },

        requestProfileInfo: async context => {

            const environment = context.config.environment || 'production';
            const baseUrl = environment === 'production'
                ? 'https://connect.squareup.com'
                : 'https://connect.squareupsandbox.com';

            const { data } = await context.httpRequest({
                method: 'GET',
                url: `${baseUrl}/v2/merchants/me`,
                headers: {
                    'Authorization': `Bearer ${context.accessToken}`,
                    'Accept': 'application/json',
                    'Square-Version': '2025-08-20'
                }
            });

            if (!data || !data.merchant) {
                throw new Error('Failed to retrieve merchant profile');
            }

            return data;
        },

        validateAccessToken: async context => {

            const environment = context.config.environment || 'production';
            const baseUrl = environment === 'production'
                ? 'https://connect.squareup.com'
                : 'https://connect.squareupsandbox.com';

            try {
                const response = await context.httpRequest({
                    method: 'GET',
                    url: `${baseUrl}/v2/merchants/me`,
                    headers: {
                        'Authorization': `Bearer ${context.accessToken}`,
                        'Accept': 'application/json',
                        'Square-Version': '2025-08-20'
                    }
                });

                return response.data;
            } catch (error) {
                return false;
            }
        }
    }
};
