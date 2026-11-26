'use strict';

const lib = require('./lib');

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            serverUrl: {
                type: 'text',
                name: 'Server URL',
                tooltip: 'The address you open Tableau at, without the path. Tableau Cloud: your pod, e.g. https://10ay.online.tableau.com or https://prod-useast-a.online.tableau.com. Tableau Server: e.g. https://tableau.example.com.'
            },
            siteContentUrl: {
                type: 'text',
                name: 'Site',
                tooltip: 'The site name from the browser URL after /site/ (e.g. "mysite" in .../#/site/mysite/home). Leave empty for the Default site of Tableau Server.'
            },
            authMethod: {
                type: 'select',
                name: 'Authentication Method',
                tooltip: 'Personal Access Token: sign in with a token of your Tableau user. Connected App: sign in with a connected app (direct trust) that a site administrator created in Tableau (Settings > Connected Apps); recommended for long-running integrations, because the session does not end when the same credentials are used elsewhere and there is no token that expires when unused. Default: Personal Access Token.',
                placeholder: 'Personal Access Token',
                options: [
                    { label: 'Personal Access Token', value: lib.AUTH_PAT },
                    { label: 'Connected App (Direct Trust)', value: lib.AUTH_CONNECTED_APP }
                ]
            },
            tokenName: {
                type: 'text',
                name: 'Personal Access Token Name',
                tooltip: 'Personal Access Token only. Create a token in Tableau: My Account Settings > Personal Access Tokens. On Tableau Cloud a site administrator may have to enable personal access tokens first. Use a token dedicated to Appmixer: signing in with the same token elsewhere ends the Appmixer session.'
            },
            tokenSecret: {
                type: 'password',
                name: 'Personal Access Token Secret',
                tooltip: 'Personal Access Token only. The secret shown once when the token was created.'
            },
            clientId: {
                type: 'text',
                name: 'Connected App Client ID',
                tooltip: 'Connected App only. In Tableau: Settings > Connected Apps > New Connected App > Direct Trust; enable the app and copy its Client ID.'
            },
            secretId: {
                type: 'text',
                name: 'Connected App Secret ID',
                tooltip: 'Connected App only. The Secret ID of a secret generated in the connected app (Generate New Secret).'
            },
            secretValue: {
                type: 'password',
                name: 'Connected App Secret Value',
                tooltip: 'Connected App only. The Secret Value of the same secret.'
            },
            username: {
                type: 'text',
                name: 'Connected App Username',
                tooltip: 'Connected App only. The Tableau user Appmixer acts as: the user name of a user of the site (on Tableau Cloud, the email address). The components can do what this user can do in Tableau.'
            }
        },

        accountNameFromProfileInfo: 'name',

        requestProfileInfo: async function(context) {

            const session = await lib.signIn(context, context);
            const site = session.siteContentUrl || 'Default';
            let user = {};
            try {
                const { data } = await context.httpRequest({
                    method: 'GET',
                    url: lib.serverOrigin(context.serverUrl) + '/api/' + lib.API_VERSION + '/sites/'
                        + session.siteId + '/users/' + session.userId,
                    headers: { 'Accept': 'application/json', 'X-Tableau-Auth': session.token }
                });
                user = data.user || {};
            } catch (err) {
                // The profile name is cosmetic; the token is valid when the sign-in succeeded.
            }
            return {
                name: (user.name || context.tokenName || context.username) + ' (' + site + ')',
                siteId: session.siteId,
                userId: session.userId
            };
        },

        validate: async function(context) {

            await lib.signIn(context, context);
            return true;
        }
    }
};
