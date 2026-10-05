'use strict';
const ZohoClient = require('../ZohoClient');
const { resolveAccountsServer, trustedAccountsServer, trustedApiDomain } = require('../endpoints');
const { assertTokenResponse, assertRefreshToken, accessTokenExpDate } = require('../oauth');

/**
 * Validate user - get user info. The data center is taken from context.profileInfo, or from the
 * account being connected (dataCenter) when there is no profileInfo yet.
 * @param {*} context
 * @return {Promise<*|null>}
 */
const validateUser = async (context) => {

    const zc = new ZohoClient(context, dataCenter);
    const { organizations } = await zc.request('GET', '/books/v3/organizations');

    if (organizations.length === 0) {
        // This suggests Zoho user hasn't created any organization yet.
        throw new Error('No organizations found for this account.');
    }
    // Select the default organization. This is the only endpoint that doesn't require the organization id.
    const organization = organizations.find(org => org.is_default_org);

    return organization;
};

/**
 * Different accounts live in different data centers - us | eu | in | au | cn | jp | ca | sa | uk | ae | sg.
 * The redirect callback names the region (`location`) and the accounts server (`accounts-server`),
 * the token response names the API host (`api_domain`). They are kept in a closure during the
 * OAuth flow and then saved into account.profileInfo (region, accountsServer, apiDomain) for
 * later API requests and token refreshes.
 */
let dataCenter = {};

module.exports = {

    type: 'oauth2',

    name: 'appmixer:zoho:books',

    definition: {

        scope: [
            'ZohoBooks.settings.READ'
        ],

        authUrl: 'https://accounts.zoho.com/oauth/v2/auth?access_type=offline&prompt=consent',

        processRedirectionCallback: async params => {

            dataCenter = {
                region: params.location || null,
                accountsServer: trustedAccountsServer(params['accounts-server'])
            };
        },

        requestAccessToken: async context => {

            const url = resolveAccountsServer(dataCenter);
            const tokenUrl = `${url}/oauth/v2/token?` +
                'grant_type=authorization_code' +
                '&client_id=' + context.clientId +
                '&client_secret=' + context.clientSecret +
                '&code=' + context.authorizationCode +
                '&redirect_uri=' + context.callbackUrl;
            const { data } = await context.httpRequest.post(tokenUrl);
            assertTokenResponse(data, 'issue an access token');
            dataCenter.accountsServer = url;
            dataCenter.apiDomain = trustedApiDomain(data.api_domain);

            return {
                accessToken: data.access_token,
                accessTokenExpDate: accessTokenExpDate(data),
                refreshToken: data.refresh_token
            };
        },

        accountNameFromProfileInfo: 'email',

        requestProfileInfo: async context => {

            const user = await validateUser(context);
            const source = (dataCenter.region || dataCenter.apiDomain) ? dataCenter : (context.profileInfo || {});
            for (const key of ['region', 'accountsServer', 'apiDomain']) {
                if (source[key]) {
                    user[key] = source[key];
                }
            }
            return user;
        },

        refreshAccessToken: async context => {

            assertRefreshToken(context.refreshToken);

            const url = resolveAccountsServer(context.profileInfo);
            const tokenUrl = `${url}/oauth/v2/token?` +
                'grant_type=refresh_token&refresh_token=' + context.refreshToken +
                '&client_id=' + context.clientId +
                '&client_secret=' + context.clientSecret;

            const { data } = await context.httpRequest.post(tokenUrl);
            assertTokenResponse(data, 'refresh the access token');

            return {
                accessToken: data.access_token,
                accessTokenExpDate: accessTokenExpDate(data)
            };
        },

        validateAccessToken: async context => {

            return validateUser(context);
        }
    }
};
