'use strict';

const lib = require('./lib');

// Toggl Track API token authentication.
// https://engineering.toggl.com/docs/track/api/authentication/
// The personal API token (Profile settings) is sent with HTTP Basic auth: username = token,
// password = the literal string "api_token". The same credential works for the Track API v9,
// the Reports API v3 and the Webhooks API v1.
// Toggl 2.0 (formerly Toggl Focus, the default for accounts created at toggl.com) is a separate
// product with its own Bearer API; its tokens are rejected by the Track API with 403.

const getMe = async (context) => {

    try {
        return await context.httpRequest({
            method: 'GET',
            url: `${lib.API_BASE_URL}/me`,
            headers: lib.authHeaders(context.apiToken)
        });
    } catch (err) {
        const status = err.response && err.response.status;
        if (status === 401 || status === 403) {
            throw new Error(
                'Toggl Track rejected the API token (' + status + '). Use the API Token shown at the bottom of ' +
                'your Toggl Track Profile settings (track.toggl.com, profile icon in the lower-left corner > ' +
                'Profile settings). Tokens generated in Toggl 2.0 (toggl.com) do not work with the Toggl Track API.'
            );
        }
        throw err;
    }
};

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            apiToken: {
                type: 'password',
                name: 'API Token',
                tooltip: 'In Toggl Track, click your profile icon in the lower-left corner > Profile settings and copy the API Token at the bottom of the page (<a href="https://support.toggl.com/en-us/article/where-is-my-api-key-located-e9ki6p/" target="_blank">help</a>). Tokens generated in Toggl 2.0 (toggl.com) do not work with Toggl Track.'
            }
        },

        accountNameFromProfileInfo: 'email',

        requestProfileInfo: async (context) => {

            const { data } = await getMe(context);

            return {
                id: data.id,
                email: data.email || data.fullname || 'Toggl Track account',
                fullname: data.fullname,
                default_workspace_id: data.default_workspace_id
            };
        },

        validate: async (context) => {

            await getMe(context);

            return true;
        }
    }
};
