'use strict';
const ZohoClient = require('../ZohoClient');
const { trustedAccountsServer, trustedApiDomain } = require('../endpoints');
const {
    exchangeAuthorizationCode,
    findApiDataCenter,
    refreshToken,
    accessTokenExpDate
} = require('../oauth');

// The current Bigin user. Users API: https://www.bigin.com/developer/docs/apis/v2/get-users.html
const CURRENT_USER_PATH = '/bigin/v2/users?type=CurrentUser';

/**
 * Different accounts live in different data centers - us | eu | in | au | cn | jp | ca | sa.
 * The data center is saved into account.profileInfo (region, accountsServer, apiDomain) for later
 * API requests and token refreshes. It is found by asking Zoho (see ../oauth.js); what the
 * redirect callback named is only a hint of which data center to try first.
 */
let dataCenter = {};

/**
 * Data center to try first: the one this process saw during the OAuth flow, else the account's.
 * @param {*} context
 * @returns {Object}
 */
const dataCenterHint = context => {

    return (dataCenter.accountsServer || dataCenter.region) ? dataCenter : (context.profileInfo || {});
};

module.exports = {

    type: 'oauth2',

    definition: {

        scope: [
            'ZohoBigin.modules.ALL',
            'ZohoBigin.settings.fields.READ',
            'ZohoBigin.users.READ',
            'ZohoBigin.notifications.ALL'
        ],

        scopeDelimiter: ',',

        // Zoho issues a refresh token only when the consent screen is shown (prompt=consent).
        authUrl: 'https://accounts.zoho.com/oauth/v2/auth?access_type=offline&prompt=consent',

        processRedirectionCallback: async params => {

            dataCenter = {
                region: params.location || null,
                accountsServer: trustedAccountsServer(params['accounts-server'])
            };
        },

        requestAccessToken: async context => {

            const { data, dataCenter: issuer } = await exchangeAuthorizationCode(context, dataCenterHint(context));
            dataCenter = { ...issuer, apiDomain: trustedApiDomain(data.api_domain) || issuer.apiDomain };

            return {
                accessToken: data.access_token,
                accessTokenExpDate: accessTokenExpDate(data),
                refreshToken: data.refresh_token
            };
        },

        accountNameFromProfileInfo: 'email',

        requestProfileInfo: async context => {

            const { data, dataCenter: found } = await findApiDataCenter(
                context,
                dataCenterHint(context),
                CURRENT_USER_PATH
            );
            const user = Array.isArray(data?.users) ? data.users[0] : null;
            if (!user) {
                throw new Error('Bigin returned no current user.');
            }
            return { id: user.id, email: user.email, name: user.full_name, ...found };
        },

        refreshAccessToken: async context => {

            const data = await refreshToken(context);

            return {
                accessToken: data.access_token,
                accessTokenExpDate: accessTokenExpDate(data)
            };
        },

        validateAccessToken: async context => {

            const client = new ZohoClient(context, dataCenter);
            const { users } = await client.request('GET', '/bigin/v2/users', { params: { type: 'CurrentUser' } });
            return Array.isArray(users) ? users[0] : null;
        }
    }
};
