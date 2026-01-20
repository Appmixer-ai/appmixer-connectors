'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        accountNameFromProfileInfo: 'account',

        auth: {
            username: {
                type: 'text',
                name: 'Username (Auth Option 1)',
                tooltip: 'For example: admin'
            },
            password: {
                type: 'text',
                name: 'Password (Auth Option 1)'
            },
            apiKey: {
                type: 'text',
                name: 'API Key (Auth Option 2)',
                tooltip: 'If API Key is entered, the username and password is ignored'
            },
            instance: {
                type: 'text',
                name: 'Instance name (Required)',
                tooltip: 'For example: dev144860'
            }
        },

        requestProfileInfo: async function(context) {

            const headers = {
                'User-Agent': 'Appmixer (info@appmixer.com)'
            };

            if (context.apiKey) {
                headers['x-sn-apikey'] = context.apiKey;
            } else {
                headers['Authorization'] = 'Basic ' + Buffer.from(context.username + ':' + context.password).toString('base64');
            }

            const options = {
                method: 'GET',
                url: 'https://' + context.instance + '.service-now.com/api/now/table/problem?sysparm_limit=1',
                headers
            };

            try {
                // Simply make a request to the API to see if the credentials are valid.
                await context.httpRequest(options);
                // If the request was successful, return the profile info.
                if (context.apiKey) {
                    // Use sliced API key when API key is provided
                    const maskedApiKey = context.apiKey.slice(0, 8) + '...';
                    return { account: context.instance + '-' + maskedApiKey };
                } else {
                    // Use username when username/password authentication is used
                    return { account: context.instance + '-' + context.username };
                }
            } catch (error) {
                return error;
            }
        },

        validate: async function(context) {

            const headers = {};

            if (context.apiKey) {
                headers['x-sn-apikey'] = context.apiKey;
            } else {
                headers['Authorization'] = 'Basic ' + Buffer.from(context.username + ':' + context.password).toString('base64');
            }

            const options = {
                method: 'GET',
                url: 'https://' + context.instance + '.service-now.com/api/now/table/problem?sysparm_limit=1',
                headers
            };
            await context.httpRequest(options);

            return true;
        }
    }
};
