const assert = require('assert');
const endpoints = require('../../endpoints');
const crmAuth = require('../../auth');
const booksAuth = require('../../books/auth');
const ZohoClient = require('../../ZohoClient');
const CrmMakeApiCall = require('../../crm/MakeApiCall/MakeApiCall');
const BooksMakeApiCall = require('../../books/MakeApiCall/MakeApiCall');

// httpRequest mock: records token requests (post) and the baseURL of every API client (create),
// answering API requests from `apiResponse`.
function mockHttpRequest(tokenResponse, apiResponse) {

    const calls = { posts: [], baseURLs: [], requests: [] };
    const httpRequest = async options => {
        calls.requests.push(options);
        return { data: {} };
    };
    httpRequest.post = async url => {
        calls.posts.push(url);
        return { data: tokenResponse };
    };
    httpRequest.create = ({ baseURL }) => {
        calls.baseURLs.push(baseURL);
        return async () => ({ data: apiResponse });
    };
    return { httpRequest, calls };
}

const CANADA_TOKEN = {
    'access_token': 'access-token',
    'refresh_token': 'refresh-token',
    'api_domain': 'https://www.zohoapis.ca',
    'token_type': 'Bearer',
    'expires_in': 3600
};

describe('Zoho data centers', () => {

    describe('endpoints', () => {

        it('should resolve each data center to its own accounts server and API host', () => {

            const expected = {
                us: ['https://accounts.zoho.com', 'https://www.zohoapis.com'],
                eu: ['https://accounts.zoho.eu', 'https://www.zohoapis.eu'],
                in: ['https://accounts.zoho.in', 'https://www.zohoapis.in'],
                au: ['https://accounts.zoho.com.au', 'https://www.zohoapis.com.au'],
                cn: ['https://accounts.zoho.com.cn', 'https://www.zohoapis.com.cn'],
                jp: ['https://accounts.zoho.jp', 'https://www.zohoapis.jp'],
                ca: ['https://accounts.zohocloud.ca', 'https://www.zohoapis.ca'],
                sa: ['https://accounts.zoho.sa', 'https://www.zohoapis.sa'],
                uk: ['https://accounts.zoho.uk', 'https://www.zohoapis.uk']
            };
            for (const [region, [accounts, api]] of Object.entries(expected)) {
                assert.strictEqual(endpoints.resolveAccountsServer({ region }), accounts, region);
                assert.strictEqual(endpoints.resolveApiDomain({ region: region.toUpperCase() }), api, region);
            }
        });

        it('should fail on an unknown region instead of falling back to the US data center', () => {

            assert.throws(() => endpoints.resolveApiDomain({ region: 'xx' }), /Unsupported Zoho data center: xx/);
            assert.throws(() => endpoints.resolveAccountsServer({ region: 'xx' }), /Unsupported Zoho data center/);
            assert.throws(() => endpoints.resolveApiDomain({}), /Missing region/);
        });

        it('should prefer the servers Zoho named over the region', () => {

            assert.strictEqual(
                endpoints.resolveAccountsServer({ accountsServer: 'https://accounts.zohocloud.ca/', region: 'us' }),
                'https://accounts.zohocloud.ca'
            );
            assert.strictEqual(
                endpoints.resolveApiDomain({ apiDomain: 'https://www.zohoapis.ca', region: 'us' }),
                'https://www.zohoapis.ca'
            );
        });

        it('should never trust a server that is not a known Zoho host', () => {

            for (const url of [
                'https://evil.example.com',
                'https://accounts.zoho.com.evil.example',
                'http://accounts.zoho.com',
                'https://accounts.zoho.com@evil.example',
                'https://www.zohoapis.com',
                undefined,
                ''
            ]) {
                assert.strictEqual(endpoints.trustedAccountsServer(url), null, String(url));
            }
            assert.strictEqual(endpoints.trustedApiDomain('https://www.zohoapis.ca.evil.example'), null);
            assert.strictEqual(endpoints.trustedApiDomain('https://accounts.zohocloud.ca'), null);
            assert.strictEqual(
                endpoints.resolveAccountsServer({ accountsServer: 'https://evil.example.com', region: 'ca' }),
                'https://accounts.zohocloud.ca'
            );
        });
    });

    describe('OAuth flow of a Canada account', () => {

        for (const [name, auth, apiResponse] of [
            ['CRM', crmAuth, { users: [{ id: '1', email: 'user@example.com' }] }],
            ['Books', booksAuth, { organizations: [{ 'organization_id': '1', 'is_default_org': true }] }]
        ]) {

            it(`${name}: should exchange the code and call the API in the Canada data center`, async () => {

                const { httpRequest, calls } = mockHttpRequest(CANADA_TOKEN, apiResponse);
                const context = {
                    clientId: 'client-id',
                    clientSecret: 'client-secret',
                    authorizationCode: 'code',
                    callbackUrl: 'https://example.com/auth/zoho/callback',
                    httpRequest
                };

                await auth.definition.processRedirectionCallback({
                    code: 'code',
                    location: 'ca',
                    'accounts-server': 'https://accounts.zohocloud.ca'
                });
                const token = await auth.definition.requestAccessToken(context);
                assert.strictEqual(token.accessToken, 'access-token');
                assert.ok(calls.posts[0].startsWith('https://accounts.zohocloud.ca/oauth/v2/token?'), calls.posts[0]);

                const profileInfo = await auth.definition.requestProfileInfo({ ...context, accessToken: 'access-token' });
                assert.strictEqual(calls.baseURLs[0], 'https://www.zohoapis.ca');
                assert.strictEqual(profileInfo.region, 'ca');
                assert.strictEqual(profileInfo.accountsServer, 'https://accounts.zohocloud.ca');
                assert.strictEqual(profileInfo.apiDomain, 'https://www.zohoapis.ca');

                await auth.definition.refreshAccessToken({ ...context, refreshToken: 'refresh-token', profileInfo });
                assert.ok(calls.posts[1].startsWith('https://accounts.zohocloud.ca/oauth/v2/token?'), calls.posts[1]);
            });
        }

        it('should fall back to the region when the callback has no accounts-server', async () => {

            const { httpRequest, calls } = mockHttpRequest(CANADA_TOKEN, {});
            await crmAuth.definition.processRedirectionCallback({ code: 'code', location: 'ca' });
            await crmAuth.definition.requestAccessToken({ clientId: 'c', clientSecret: 's', httpRequest });
            assert.ok(calls.posts[0].startsWith('https://accounts.zohocloud.ca/'), calls.posts[0]);
        });
    });

    describe('existing accounts with only a stored region', () => {

        it('should keep using the region for the API and token refresh', async () => {

            const { httpRequest, calls } = mockHttpRequest(CANADA_TOKEN, {});
            const profileInfo = { region: 'eu' };

            new ZohoClient({ auth: { accessToken: 'token' }, profileInfo, httpRequest });
            assert.strictEqual(calls.baseURLs[0], 'https://www.zohoapis.eu');

            await crmAuth.definition.refreshAccessToken({
                clientId: 'c', clientSecret: 's', refreshToken: 'r', profileInfo, httpRequest
            });
            assert.ok(calls.posts[0].startsWith('https://accounts.zoho.eu/'), calls.posts[0]);
        });
    });

    describe('MakeApiCall', () => {

        function makeApiCallContext(profileInfo, httpRequest) {

            return {
                auth: { accessToken: 'token' },
                profileInfo,
                httpRequest,
                messages: { in: { content: { url: '/test', method: 'GET' } } },
                sendJson: async () => {},
                CancelError: Error
            };
        }

        it('CRM: should call the API host of the account data center', async () => {

            const { httpRequest, calls } = mockHttpRequest(CANADA_TOKEN, {});
            await CrmMakeApiCall.receive(makeApiCallContext({ region: 'ca', apiDomain: 'https://www.zohoapis.ca' }, httpRequest));
            await CrmMakeApiCall.receive(makeApiCallContext({ region: 'jp' }, httpRequest));
            await CrmMakeApiCall.receive(makeApiCallContext(undefined, httpRequest));
            assert.deepStrictEqual(calls.requests.map(r => r.url), [
                'https://www.zohoapis.ca/test',
                'https://www.zohoapis.jp/test',
                'https://www.zohoapis.com/test'
            ]);
        });

        it('Books: should call the API host of the account data center', async () => {

            const { httpRequest, calls } = mockHttpRequest(CANADA_TOKEN, {});
            await BooksMakeApiCall.receive(makeApiCallContext({ region: 'ca' }, httpRequest));
            assert.strictEqual(calls.requests[0].url, 'https://www.zohoapis.ca/books/v3/test');
        });
    });
});
