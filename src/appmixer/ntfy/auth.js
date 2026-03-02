'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            serverUrl: {
                type: 'text',
                name: 'Server URL',
                tooltip: 'The ntfy server URL. Use <b>https://ntfy.sh</b> for the public ntfy.sh server, or your own self-hosted server URL (e.g. <b>https://ntfy.example.com</b>).',
                default: 'https://ntfy.sh'
            },
            accessToken: {
                type: 'password',
                name: 'Access Token',
                tooltip: 'Your ntfy access token. Required for protected topics and the ntfy.sh paid tier. Create one in the ntfy web app under <b>Account → Access Tokens</b>. Leave blank only if publishing to a public unprotected topic.'
            }
        },

        validate: async context => {

            const serverUrl = (context.serverUrl || 'https://ntfy.sh').replace(/\/$/, '');

            // If a token is provided, validate it by calling the account endpoint.
            // ntfy.sh returns 401 for invalid tokens and 200 for valid ones.
            if (context.accessToken) {
                const response = await context.httpRequest({
                    method: 'GET',
                    url: `${serverUrl}/v1/account`,
                    headers: {
                        'Authorization': `Bearer ${context.accessToken}`
                    }
                });

                if (response.statusCode === 401 || response.statusCode === 403) {
                    throw new context.Error('Invalid access token. Please check your token and try again.', 'INVALID_CREDENTIALS');
                }
                if (response.statusCode !== 200) {
                    throw new context.Error(`Could not reach ntfy server at ${serverUrl} (HTTP ${response.statusCode}).`, 'SERVER_ERROR');
                }
            } else {
                // No token: just check that the server is reachable.
                const response = await context.httpRequest({
                    method: 'GET',
                    url: `${serverUrl}/v1/health`
                });

                if (response.statusCode !== 200) {
                    throw new context.Error(`Could not reach ntfy server at ${serverUrl}. Please verify the Server URL.`, 'SERVER_UNREACHABLE');
                }
            }
        }
    }
};
