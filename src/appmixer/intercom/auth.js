'use strict';

module.exports = {
    type: 'oauth2',
    definition: () => {
        const fetchProfile = async (context) => {

            return await context.httpRequest({
                method: 'GET',
                url: 'https://api.intercom.io/me',
                headers: {
                    'Authorization': `Bearer ${context.accessToken}`,
                    'Intercom-Version': '2.14'
                }
            });
        };

        return {
            clientId: process.env.INTERCOM_CLIENT_ID,
            clientSecret: process.env.INTERCOM_CLIENT_SECRET,

            accountNameFromProfileInfo: (context) => context.profileInfo.email,

            emailFromProfileInfo: (context) => context.profileInfo.email,

            authUrl: (context) => {
                const params = new URLSearchParams({
                    client_id: context.clientId,
                    redirect_uri: context.callbackUrl,
                    response_type: 'code',
                    state: context.ticket
                });
                return `https://app.intercom.com/oauth?${params}`;
            },

            requestAccessToken: async (context) => {
                const response = await context.httpRequest({
                    method: 'POST',
                    url: 'https://api.intercom.io/auth/eagle/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: {
                        code: context.authorizationCode,
                        client_id: context.clientId,
                        client_secret: context.clientSecret
                    }
                });

                return {
                    accessToken: response.data.token
                    // Intercom doesn't provide expiration time, so we don't set accessTokenExpDate
                };
            },

            requestProfileInfo: async (context) => {

                const response = await fetchProfile(context);

                if (!response.data) {
                    throw new Error('Failed to retrieve profile info');
                }

                return response.data;
            },

            validateAccessToken: async (context) => {

                const response = await fetchProfile(context);
                return !!response.data && !!response.data.id;
            }
        };
    }
};
