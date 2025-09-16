'use strict';

module.exports = {
    type: 'apiKey',

    definition: {
        tokenType: 'authentication-token',

        auth: {
            storeHash: {
                type: 'text',
                name: 'Store Hash',
                tooltip: 'You can find it by login to your BigCommerce Store -> Go to Settings -> Click API Accounts -> Create API Account (V2/V3 Token), in the "API path" field it shows the store hash in this url: https://api.bigcommerce.com/stores/<storehash>/v3'
            },
            accessToken: {
                type: 'text',
                name: 'Access Token',
                tooltip: 'You can generate it by login to your BigCommerce Store -> Go to Settings -> Click API Accounts -> Create API Account (V2/V3 Token), more information <a href="https://developer.bigcommerce.com/docs/start/authentication#access-tokens" target="_blank">here</a>.'
            }
        },

        accountNameFromProfileInfo: 'store_name',

        requestProfileInfo: async (context) => {

            const url = `https://api.bigcommerce.com/stores/${context.storeHash}/v2/store`;
            const headers = {
                'X-Auth-Token': context.accessToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            const response = await context.httpRequest({
                method: 'GET',
                url,
                headers
            });

            if (!response.data) {
                throw new Error('Failed to retrieve store profile info');
            }

            return {
                domain: response.data.domain,
                store_name: response.data.name,
                admin_email: response.data.admin_email,
                email: response.data.admin_email,
                store_hash: context.storeHash
            };
        },

        validate: async (context) => {

            const url = `https://api.bigcommerce.com/stores/${context.storeHash}/v2/store`;
            const headers = {
                'X-Auth-Token': context.accessToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            try {
                const response = await context.httpRequest({
                    method: 'GET',
                    url,
                    headers
                });

                return !!(response.data && response.data.domain);
            } catch (error) {
                return false;
            }
        }
    }
};
