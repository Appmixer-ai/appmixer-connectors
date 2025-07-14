'use strict';

module.exports = {
    type: 'oauth2',

    definition: {

        scope: ['read', 'write'],

        scopeDelimiter: ',',

        /**
         * Extract account name from profile info for display in UI
         * @param context
         * @returns {string}
         */
        accountNameFromProfileInfo: context => {
            return context.profileInfo.name || context.profileInfo.email;
        },

        /**
         * Extract email from profile info
         * @param context
         * @returns {string}
         */
        emailFromProfileInfo: context => {
            return context.profileInfo.email;
        },

        /**
         * Generate the authorization URL where users will be redirected to grant access
         * @param context
         * @returns {string}
         */
        authUrl: context => {
            const params = new URLSearchParams({
                client_id: context.clientId,
                redirect_uri: context.callbackUrl,
                response_type: 'code',
                scope: context.scope.join(','),
                state: context.ticket
            }).toString();

            return `https://linear.app/oauth/authorize?${params}`;
        },

        /**
         * Exchange authorization code for access token
         * @param context
         * @returns {Promise<object>}
         */
        requestAccessToken: async context => {
            const data = {
                code: context.authorizationCode,
                client_id: context.clientId,
                client_secret: context.clientSecret,
                redirect_uri: context.callbackUrl,
                grant_type: 'authorization_code'
            };

            const response = await context.httpRequest({
                method: 'POST',
                url: 'https://api.linear.app/oauth/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data
            });

            if (!response.data || !response.data.access_token) {
                throw new Error('Failed to obtain access token');
            }

            const expDate = new Date();
            expDate.setTime(expDate.getTime() + (response.data.expires_in * 1000));

            return {
                accessToken: response.data.access_token,
                accessTokenExpDate: expDate
                // Linear OAuth tokens are long-lived and don't include refresh tokens by default
            };
        },

        /**
         * Get user profile information using the access token
         * @param context
         * @returns {Promise<object>}
         */
        requestProfileInfo: async context => {
            const response = await context.httpRequest({
                method: 'POST',
                url: 'https://api.linear.app/graphql',
                headers: {
                    'Authorization': `Bearer ${context.accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    query: '{ viewer { id name email } }'
                }
            });

            if (!response.data || !response.data.data || !response.data.data.viewer) {
                throw new Error('Failed to retrieve profile info');
            }

            return response.data.data.viewer;
        },

        /**
         * Validate that the access token is still valid
         * @param context
         * @returns {Promise<boolean>}
         */
        validateAccessToken: async context => {
            try {
                const response = await context.httpRequest({
                    method: 'POST',
                    url: 'https://api.linear.app/graphql',
                    headers: {
                        'Authorization': `Bearer ${context.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        query: '{ viewer { id } }'
                    }
                });

                return !!(response.data && response.data.data && response.data.data.viewer);
            } catch (error) {
                return false;
            }
        }

    }
};
