'use strict';

const lib = require('./lib');

// Nuki Web API token (https://docs.nuki.io/guide/authorization/token/). The token is created by
// the account owner in Nuki Web, reaches only the devices of that account and does not expire.
// OAuth 2 (the Authorization Code grant Nuki requires for integrations offered to third parties)
// needs the Advanced API, which Nuki approves per application, and is not implemented here.
module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            apiKey: {
                type: 'password',
                name: 'API Token',
                tooltip: 'In <a href="https://web.nuki.io" target="_blank">Nuki Web</a> open <i>API</i>, '
                    + 'accept the API terms and click <i>Generate API token</i>. Select the scopes '
                    + '<code>smartlock.readOnly</code>, <code>smartlock.action</code>, <code>smartlock.auth</code> '
                    + 'and <code>smartlock.log</code> (add <code>account</code> to show the account name here). '
                    + 'The token is shown only once.'
            }
        },

        accountNameFromProfileInfo: 'accountName',

        // GET /account needs the "account" scope, which the components do not need. Without it the
        // account is labelled with the masked token instead of failing the connection.
        requestProfileInfo: async (context) => {

            const token = String(context.apiKey || '').trim();
            const masked = token.length > 12
                ? `${token.substring(0, 4)}...${token.slice(-4)}`
                : 'Nuki API token';

            try {
                const account = await lib.request(context, { path: '/account' });
                return {
                    accountName: account.email || account.name || masked,
                    accountId: account.accountId,
                    name: account.name,
                    email: account.email
                };
            } catch (err) {
                return { accountName: masked };
            }
        },

        // GET /smartlock is what every component depends on. It needs the scope "smartlock.readOnly"
        // (or "smartlock") and has no side effects.
        validate: async (context) => {

            try {
                await lib.request(context, { path: '/smartlock' });
            } catch (err) {
                const status = err.response && err.response.status;
                if (status === 401) {
                    throw new Error('Nuki did not accept the API token. Check that the token is complete and that '
                        + 'it has the scope smartlock.readOnly.');
                }
                // Rate limits, outages and network errors keep their message, so that a transient
                // failure is not reported as a bad token.
                throw err;
            }
            return true;
        }
    }
};
