'use strict';

const lib = require('./lib');

// Toggl Track API token authentication.
// https://engineering.toggl.com/docs/track/api/authentication/
// The personal API token (Profile settings) is sent with HTTP Basic auth: username = token,
// password = the literal string "api_token". The same credential works for the Track API v9,
// the Reports API v3 and the Webhooks API v1.
module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            apiToken: {
                type: 'password',
                name: 'API Token',
                tooltip: 'Copy your personal API token from Toggl Track > <a href="https://track.toggl.com/profile" target="_blank">Profile settings</a> (API Token section). Use Toggl Track, not the Toggl 2.0 (Focus) API key.'
            }
        },

        accountNameFromProfileInfo: 'email',

        requestProfileInfo: async (context) => {

            const { data } = await context.httpRequest({
                method: 'GET',
                url: `${lib.API_BASE_URL}/me`,
                headers: lib.authHeaders(context.apiToken)
            });

            return {
                id: data.id,
                email: data.email || data.fullname || 'Toggl Track account',
                fullname: data.fullname,
                default_workspace_id: data.default_workspace_id
            };
        },

        validate: async (context) => {

            await context.httpRequest({
                method: 'GET',
                url: `${lib.API_BASE_URL}/me`,
                headers: lib.authHeaders(context.apiToken)
            });

            return true;
        }
    }
};
