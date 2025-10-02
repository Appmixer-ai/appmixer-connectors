'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            accessToken: {
                type: 'text',
                name: 'API Token',
                tooltip: 'Your Front API Token. You can find it in your account inside Settings > Developers > API Tokens tab.'
            }
        },

        accountNameFromProfileInfo: 'name',

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

        validate: {
            method: 'GET',
            url: 'https://api2.frontapp.com/me',
            headers: {
                Authorization: 'Bearer {{accessToken}}',
                accept: 'application/json'
            }
        }
    }
};
