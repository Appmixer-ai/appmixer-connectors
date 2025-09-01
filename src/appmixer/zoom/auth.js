'use strict';

module.exports = {

    type: 'oauth2',

    definition: {

        scope: [
            'user:read:user',
            'meeting:write:meeting',
            'meeting:delete:meeting',
            'meeting:read:list_meetings',
            'cloud_recording:read:list_user_recordings',
            'meeting:read:meeting',
            'meeting:update:meeting'
        ],

        authUrl: (context) => {
            return 'https://zoom.us/oauth/authorize?' +
                'response_type=code&' +
                `client_id=${encodeURIComponent(context.clientId)}&` +
                `redirect_uri=${encodeURIComponent(context.callbackUrl)}&` +
                `state=${encodeURIComponent(context.ticket)}&` +
                `scope=${context.scope.join(',')}&` +
                'include_granted_scopes';
        },

        requestAccessToken: 'https://zoom.us/oauth/token',

        refreshAccessToken: 'https://zoom.us/oauth/token',

        requestProfileInfo: 'https://api.zoom.us/v2/users/me',

        accountNameFromProfileInfo: 'email',

        validate: 'https://api.zoom.us/v2/users/me'
    }
};
