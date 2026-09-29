'use strict';
const ZohoClient = require('../ZohoClient');
const { accountsEndpoint } = require('../endpoints');
const { assertTokenResponse, assertRefreshToken, accessTokenExpDate } = require('../oauth');

/**
 * Validate user - get user info. 'region' property has to be in context.profileInfo.region or the second
 * parameter region has to be passed.
 * @param {string} accessToken
 * @param {string} [region]
 * @return {Promise<*|null>}
 */
const validateUser = async (context) => {

    const zc = new ZohoClient(context, region);
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
 * Different accounts may have different regions - us | in | eu | ...
 * We get that information from the Oauth2 redirect callback, store it in a closure and then save it into
 * the account.profileInfo.region property where it can later be used for other API requests.
 */
let region;

module.exports = {

    type: 'oauth2',

    name: 'appmixer:zoho:books',

    definition: {

        scope: [
            'ZohoBooks.settings.READ'
        ],

        authUrl: 'https://accounts.zoho.com/oauth/v2/auth?access_type=offline&prompt=consent',

        processRedirectionCallback: async params => {

            if (params.location) {
                region = params.location;
            } else {
                region = null;
            }
        },

        requestAccessToken: async context => {

            const url = accountsEndpoint(region);
            const tokenUrl = `${url}/oauth/v2/token?` +
                'grant_type=authorization_code' +
                '&client_id=' + context.clientId +
                '&client_secret=' + context.clientSecret +
                '&code=' + context.authorizationCode +
                '&redirect_uri=' + context.callbackUrl;
            const { data } = await context.httpRequest.post(tokenUrl);
            assertTokenResponse(data, 'issue an access token');

            return {
                accessToken: data.access_token,
                accessTokenExpDate: accessTokenExpDate(data),
                refreshToken: data.refresh_token
            };
        },

        accountNameFromProfileInfo: 'email',

        requestProfileInfo: async context => {

            const user = await validateUser(context);
            if (region) {
                user.region = region;
            } else if (context.profileInfo?.region) {
                user.region = context.profileInfo.region;
            }
            return user;
        },

        refreshAccessToken: async context => {

            assertRefreshToken(context.refreshToken);

            const url = accountsEndpoint(context.profileInfo.region);
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
