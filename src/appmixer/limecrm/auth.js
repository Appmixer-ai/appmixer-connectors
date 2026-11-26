'use strict';

const lib = require('./lib');

// Lime CRM authenticates REST calls with the API key of an API user, sent as x-api-key.
// Every application has its own URL (https://<host>/<application>), so the account
// stores it next to the key. lib.applicationUrl() refuses anything but an https URL
// without credentials, query or fragment - the key is never sent to another host.
async function listLimetypes(context) {

    const { base } = lib.applicationUrl(context.serverUrl);
    return context.httpRequest({
        method: 'GET',
        url: base + '/api/v1/limetype/',
        headers: lib.authHeaders(context.apiKey)
    });
}

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            serverUrl: {
                type: 'text',
                name: 'Server URL',
                tooltip: 'The address of your Lime CRM application including the application name, e.g. <code>https://acme.lime-crm.com/acme</code> for Lime CRM Cloud, or the URL of your on-premise server.'
            },
            apiKey: {
                type: 'password',
                name: 'API Key',
                tooltip: 'In Lime Admin (or LISA on premise) open <b>Security → Users</b>, create a user of type <b>API</b> with the groups it needs, select it and click <b>Create API key</b>. The key is shown only once. Webhook triggers need the user to be an administrator or a member of the <i>Webhook Users</i> group. See <a href="https://docs.lime-crm.com/integration/rest-apis/start" target="_blank">Lime CRM REST APIs</a>.'
            }
        },

        requestProfileInfo: async (context) => {

            const { origin, path } = lib.applicationUrl(context.serverUrl);
            return { application: origin.replace(/^https:\/\//, '') + path };
        },

        accountNameFromProfileInfo: 'application',

        validate: async (context) => {

            try {
                await listLimetypes(context);
            } catch (err) {
                const status = err.response && err.response.status;
                if (status === 401 || status === 403 || status === 404) {
                    // Lime CRM answers 404 instead of 401 to unauthorized callers.
                    throw new Error('Lime CRM refused the API key, or the Server URL does not point to a Lime CRM application (HTTP ' + status + ').');
                }
                throw err;
            }
            return true;
        }
    }
};
