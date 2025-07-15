'use strict';

module.exports = {

    type: 'oauth2',

    definition: {

        scope: [],

        scopeDelimiter: ' ',

        authUrl: 'https://zoom.us/oauth/authorize',

        requestAccessToken: 'https://zoom.us/oauth/token',

        refreshAccessToken: 'https://zoom.us/oauth/token',

        requestProfileInfo: 'https://api.zoom.us/v2/users/me',

        accountNameFromProfileInfo: 'email',

        validate: 'https://api.zoom.us/v2/users/me'
    }
};
