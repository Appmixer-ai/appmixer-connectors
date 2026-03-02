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

            if (context.accessToken) {
                // Validate the token by calling the account endpoint.
                const response = await context.httpRequest({
                    method: 'GET',
                    url: `${serverUrl}/v1/account`,
                    headers: {
                        'Authorization': `Bearer ${context.accessToken}`
                    }
                });

                if (!response.data || response.data.code === 'unauthorized' || response.data.code === 'forbidden') {
                    throw new Error('Invalid access token. Please check your token and try again.');
                }
            } else {
                // No token: verify the server is reachable via its health endpoint.
                const response = await context.httpRequest({
                    method: 'GET',
                    url: `${serverUrl}/v1/health`
                });

                if (!response.data || !response.data.healthy) {
                    throw new Error(`Could not reach ntfy server at ${serverUrl}. Please verify the Server URL.`);
                }
            }
        }
    }
};
