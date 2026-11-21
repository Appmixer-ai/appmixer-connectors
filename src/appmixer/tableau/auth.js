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
            tokenName: {
                type: 'text',
                name: 'Personal Access Token Name',
                tooltip: 'Create a token in Tableau: My Account Settings > Personal Access Tokens. On Tableau Cloud a site administrator may have to enable personal access tokens first. Use a token dedicated to Appmixer: signing in with the same token elsewhere ends the Appmixer session.'
            },
            tokenSecret: {
                type: 'password',
                name: 'Personal Access Token Secret',
                tooltip: 'The secret shown once when the token was created.'
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
                name: (user.name || context.tokenName) + ' (' + site + ')',
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
