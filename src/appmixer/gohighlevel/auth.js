'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            accessToken: {
                type: 'text',
                name: 'Private Integration Token',
                tooltip: 'Go to GoHighLevel → Settings → Private Integrations and generate a token. Paste it here.'
            },
            locationId: {
                type: 'text',
                name: 'Location ID',
                tooltip: 'Your GoHighLevel sub-account (location) ID. Found in the URL when inside a sub-account: app.gohighlevel.com/location/<ID>/...'
            }
        },

        accountNameFromProfileInfo: 'name',

        requestProfileInfo: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: `https://services.leadconnectorhq.com/contacts/`,
                headers: {
                    'Authorization': `Bearer ${context.accessToken}`,
                    'Version': '2021-07-28'
                },
                params: {
                    locationId: context.locationId,
                    limit: 1
                }
            });
            return {
                id: context.locationId,
                name: `GoHighLevel (${context.locationId})`,
                email: ''
            };
        },

        validate: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: `https://services.leadconnectorhq.com/contacts/`,
                headers: {
                    'Authorization': `Bearer ${context.accessToken}`,
                    'Version': '2021-07-28'
                },
                params: {
                    locationId: context.locationId,
                    limit: 1
                }
            });
            return response.data && typeof response.data === 'object';
        }
    }
};
