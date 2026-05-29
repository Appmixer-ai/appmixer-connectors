'use strict';

const TENANT = 'common';

module.exports = {

    type: 'oauth2',

    definition: {

        scope: ['offline_access'],

        scopeDelimiter: ' ',

        authUrl: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`,

        requestAccessToken: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,

        refreshAccessToken: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,

        accountNameFromProfileInfo: () => {
            return 'Power BI';
        },

        requestProfileInfo: {
            method: 'GET',
            url: 'https://api.powerbi.com/v1.0/myorg/datasets',
            auth: {
                bearer: '{{accessToken}}'
            }
        },

        validateAccessToken: {
            method: 'GET',
            url: 'https://api.powerbi.com/v1.0/myorg/datasets',
            auth: {
                bearer: '{{accessToken}}'
            }
        }
    }
};
