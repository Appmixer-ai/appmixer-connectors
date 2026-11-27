'use strict';

const lib = require('./lib');

// Gorgias REST API keys: https://developers.gorgias.com/docs/access-tokens-api-keys
// A key is created under Settings > REST API, belongs to one user and carries that user's
// permissions. Requests go to the account's own host, https://{subdomain}.gorgias.com/api, with
// HTTP Basic auth: the user's login email as the username and the key as the password.
// Gorgias allows API keys for private integrations only; public apps use OAuth2 after a partner
// review, which this connector does not need.

const getAccount = async (context) => {

    // lib.apiOrigin() throws before the request when the subdomain is not a plain subdomain.
    const url = `${lib.apiOrigin(context.subdomain)}/api/account`;
    try {
        return await context.httpRequest({
            method: 'GET',
            url,
            headers: lib.authHeaders(context)
        });
    } catch (err) {
        const status = err.response && err.response.status;
        if (status === 401 || status === 403) {
            throw new Error(
                'Gorgias rejected the credentials (' + status + '). Use the email you log in to Gorgias with and an ' +
                'API key from Settings > REST API of the same user.'
            );
        }
        if (status === 404) {
            throw new Error('No Gorgias account at that subdomain. Enter "acme" for https://acme.gorgias.com.');
        }
        throw err;
    }
};

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            subdomain: {
                type: 'text',
                name: 'Subdomain',
                tooltip: 'The subdomain of your Gorgias helpdesk: <b>acme</b> for https://acme.gorgias.com.'
            },
            username: {
                type: 'text',
                name: 'Email',
                tooltip: 'The email address you log in to Gorgias with. It is the username of the API key.'
            },
            apiKey: {
                type: 'password',
                name: 'API Key',
                tooltip: 'In Gorgias, go to Settings > REST API and click Create API key. The key acts with the permissions of your user.'
            }
        },

        accountNameFromProfileInfo: 'name',

        requestProfileInfo: async (context) => {

            const { data } = await getAccount(context);
            const domain = (data && data.domain) || context.subdomain;
            return {
                name: `${String(context.username || '').trim()} (${domain}.gorgias.com)`,
                domain
            };
        },

        validate: async (context) => {

            await getAccount(context);
            return true;
        }
    }
};
