'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your LemonSqueezy account and find your API Key in the API section of your dashboard.'
            }
        },

        fetchUserInfo: async function(context) {
            return context.httpRequest({
                method: 'GET',
                url: 'https://api.lemonsqueezy.com/v1/users/me',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Accept': 'application/json'
                }
            });
        },

        requestProfileInfo: async function(context) {
            const userInfo = await this.fetchUserInfo(context);
            return userInfo.data.data.attributes;
        },

        accountNameFromProfileInfo: 'email',

        validate: async function(context) {
            await this.fetchUserInfo(context);
            return true;
        }
    }
};
