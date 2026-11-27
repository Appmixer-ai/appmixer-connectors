'use strict';

/* eslint-disable max-len */

const assert = require('assert');

const lib = require('../../lib');
const auth = require('../../auth');
const routes = require('../../routes');

const SendReservations = require('../../core/SendReservations/SendReservations');
const SendGroupBlocks = require('../../core/SendGroupBlocks/SendGroupBlocks');
const SendInventory = require('../../core/SendInventory/SendInventory');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

class InvalidTokenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidTokenError';
    }
}

// No request of these tests leaves the process: every HTTP call goes to a mocked httpRequest.
// IDeaS publishes no API host, so ORIGIN is a made-up host under ideasrms.com.
const ORIGIN = 'https://api.test.ideasrms.com';
const TOKEN_URL = ORIGIN + '/api/uis/external_m2m/oauth2/token';
const MOCK_ORIGIN = 'https://api-mock-service.ideasrms.com';
const ACCOUNT = {
    baseUrl: ORIGIN,
    clientId: 'client-1',
    clientSecret: 'secret-1-do-not-leak',
    clientCode: 'TESTCLIENT',
    propertyCode: 'TESTHOTELCODE'
};
const APPMIXER = 'https://api.appmixer.example';
const WEBHOOK = `${APPMIXER}/flows/flow-1/components/component-1?correlationId=corr-1&correlationInPort=in&messageId=msg-1`;

const tokenResponse = (token = 'jwt-1', extra = {}) => ({ data: { access_token: token, expires_in: 3600, token_type: 'Bearer', ...extra } });

const httpError = (status, data, headers = {}) => Object.assign(new Error('Request failed with status code ' + status), {
    response: { status, data, headers },
    // The HTTP client's error carries the request, with the secret in it.
    config: { data: 'client_secret=secret-1-do-not-leak', headers: { Authorization: 'Bearer jwt-1' } }
});

// A response that is an Error makes httpRequest reject with it. A function is called with the request.
const createContext = ({ account = ACCOUNT, config = {}, content = {}, responses = [], webhook, cache = {}, flowId = 'flow-1', componentId = 'component-1' } = {}) => {

    const context = {
        auth: account,
        config,
        flowId,
        componentId,
        messages: webhook !== undefined ? { webhook: { content: webhook } } : { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        responses: [],
        logs: [],
        cache,
        locks: [],
        async httpRequest(options) {
            this.requests.push(options);
            let next = responses.length ? responses.shift() : { status: 202, data: '5b0e7c52-1f0a-4c55-9a43-0d3c8e2b7f11' };
            if (typeof next === 'function') {
                next = next(options);
            }
            if (next instanceof Error) {
                throw next;
            }
            return { status: 200, headers: {}, ...next };
        },
        getWebhookUrl(options) {
            assert.deepStrictEqual(options, { inPortName: 'in' });
            return WEBHOOK.replace('flow-1', flowId).replace('component-1', componentId);
        },
        async sendJson(data, port) {
            this.sent.push({ data, port });
        },
        async response(body, statusCode = 200) {
            this.responses.push({ body, statusCode });
        },
        async log(level, message, data) {
            this.logs.push({ level, message, data });
        },
        async lock(key, options) {
            context.locks.push(key);
            context.lockOptions = options;
            return { async unlock() {} };
        },
        // The connector's service state: one database for all flows and users of the connector.
        service: {
            stateGet: async key => context.cache[key],
            stateSet: async (key, value) => {
                context.cache[key] = value;
            }
        },
        // Per flow, emptied when the flow starts or stops: must not hold the token.
        staticCache: {
            get: async () => {
                throw new Error('the static cache must not be used for the token');
            },
            set: async () => {
                throw new Error('the static cache must not be used for the token');
            }
        }
    };
    return context;
};

const keyOf = (account = ACCOUNT) => lib.tokenCacheKey(lib.account({ auth: account }));
const seal = (token, issuedAt) => lib.sealToken(lib.account({ auth: ACCOUNT }), { token, issuedAt, expiresAt: issuedAt + 3600 * 1000 });
const storedToken = (cache, account = ACCOUNT) => lib.openToken(lib.account({ auth: account }), cache[keyOf(account)]);

const tokenRequests = (context) => context.requests.filter(request => request.url === TOKEN_URL);
const apiRequests = (context) => context.requests.filter(request => request.url !== TOKEN_URL);

const createAuthContext = (fields, responses = []) => ({
    ...fields,
    config: {},
    InvalidTokenError,
    requests: [],
    async httpRequest(options) {
        this.requests.push(options);
        const next = responses.length ? responses.shift() : tokenResponse();
        if (next instanceof Error) {
            throw next;
        }
        return { status: 200, headers: {}, ...next };
    }
});

// The documentation's own samples (https://developers.ideas.com/), numbers typed as text as there.
const RESERVATION_SAMPLE = {
    clientCode: 'TESTCLIENT',
    propertyCode: 'TESTHOTELCODE',
    correlationId: '6825ceed2ea6702a68b8e6',
    lastModifiedDateTime: '2021-10-14T12:55:20.311Z',
    reservationId: '219849-839960',
    confirmationNumber: '839960',
    status: 'RESERVED',
    bookingDateTime: '2022-01-01T12:23:34Z',
    numberOfRooms: 1,
    multiReservationId: null,
    shareId: '2321',
    cancellationDateTime: null,
    cancellationReason: null,
    channel: 'GDS',
    nationality: 'NL',
    roomStays: [{
        arrivalDate: '2021-07-03',
        departureDate: '2021-07-04',
        roomTypeCode: 'SGC',
        bookedRoomTypeCode: 'DBL',
        marketSegmentCode: 'CORP',
        groupBlockCode: 'Grp1',
        sourceBookingCode: 'AA',
        roomNumber: '100',
        numberOfAdults: '1',
        numberOfChildren: '2',
        currencyCode: 'USD',
        rateCode: 'FLRA3',
        rates: [{ startDate: '2021-07-03', endDate: '2021-07-04', rateValue: '68.87', grossRateValue: '82.64' }],
        childAgeBuckets: [{ minimumAge: '3', maximumAge: '8', numberOfChildren: '2' }],
        services: [{ startDate: '2021-07-03', endDate: '2021-07-04', serviceName: 'SPCT', serviceValue: 2.83, inclusive: false, reservationPackage: false, roomRevenuePackage: false }]
    }],
    profiles: [{ id: '7564321', name: 'IDeaS', profileType: 'COMPANY', context: null }],
    stayRevenue: {
        daily: [{ occupancyDate: '2021-07-03', netRoomRevenue: '68.87', netFoodRevenue: '0.00', netBeverageRevenue: '0.00', netOtherRevenue: '2.83', netTicketPrice: '80.00', ticketPrice: '100.00', netTotalRevenue: '151.7', grossTotalRevenue: '185.47' }],
        summary: { netTotalTicketRevenue: '160.00', totalTicketRevenue: '200.00' }
    }
};

const GROUP_SAMPLE = {
    groupCode: 'GRP-2026-12',
    action: 'COMMIT',
    name: 'Acme Sales Meeting',
    groupStatusCode: 'DEFINITE',
    marketSegmentCode: 'GRP',
    startDate: '2026-12-10',
    endDate: '2026-12-12',
    groupTypeCode: 'GROUP',
    bookingDate: '2026-11-20',
    lastModifiedDateTime: '2026-11-26T09:00:00Z',
    groupBlocks: [{ occupancyDate: '2026-12-10', roomTypeCode: 'DBL', blocks: 10, pickup: '4', currencyCode: 'EUR', singlePersonRate: '120.00' }]
};

const INVENTORY_SAMPLE = {
    occupancyDate: '2026-12-01',
    roomTypeInventories: [{ roomTypeCode: 'DBL', roomTypeCapacity: 40, roomsNotAvailableMaintenance: 1, roomsSold: '23' }]
};

// The reply token of a ReplyTo URL.
const tokenOf = (replyUrl) => /\/trackers\/([^/]+)$/.exec(new URL(replyUrl).pathname)[1];

// Send one message and return the context and the ReplyTo URL it handed to IDeaS.
const submitInventory = async (options = {}) => {

    const context = createContext({ content: { inventories: JSON.stringify([INVENTORY_SAMPLE]), correlationId: 'batch-7' }, responses: [tokenResponse(), { status: 202, data: 'tracker-1' }], ...options });
    await SendInventory.receive(context);
    const api = apiRequests(context)[0];
    return { context, replyUrl: api.headers.ReplyTo };
};

// What the engine hands the component when the route calls triggerComponent().
const webhookContent = (token, body, query = { correlationId: 'corr-1', correlationInPort: 'in', messageId: 'msg-1' }, trackerId = '') => ({
    method: 'unknown',
    data: { ideasReply: { token, trackerId, body } },
    query
});

describe('appmixer.ideas', () => {

    describe('Base URL', () => {

        it('accepts IDeaS hosts, with or without the API prefix', () => {

            assert.strictEqual(lib.resolveOrigin(null, 'https://api.test.ideasrms.com'), ORIGIN);
            assert.strictEqual(lib.resolveOrigin(null, 'https://api.test.ideasrms.com/api/public/v1/'), ORIGIN);
            assert.strictEqual(lib.resolveOrigin(null, ' https://API.Test.IDEAS.com/ '), 'https://api.test.ideas.com');
            assert.strictEqual(lib.resolveOrigin(null, MOCK_ORIGIN), MOCK_ORIGIN);
        });

        it('refuses every URL a credential must not be sent to', () => {

            for (const value of [
                'http://api.test.ideasrms.com',
                'https://evil.example',
                'https://ideasrms.com.evil.example',
                'https://evilideasrms.com',
                'https://ideasrms.com',
                'https://api.test.ideasrms.com@evil.example',
                'https://user:pass@api.test.ideasrms.com',
                'https://evil.example/.ideasrms.com',
                'https://api.test.ideasrms.com:8443',
                'https://api.test.ideasrms.com/other/path',
                'https://api.test.ideasrms.com/?x=1',
                'https://127.0.0.1',
                '//api.test.ideasrms.com',
                '',
                undefined
            ]) {
                assert.throws(() => lib.resolveOrigin({ CancelError }, value), CancelError, String(value));
            }
        });

        it('takes an administrator-allowed host, exact names only', () => {

            const context = { CancelError, config: { additionalApiHosts: ' rms.partner-env.example , 10.0.0.1, *.evil.example, https://x.example' } };
            assert.strictEqual(lib.resolveOrigin(context, 'https://rms.partner-env.example'), 'https://rms.partner-env.example');
            assert.throws(() => lib.resolveOrigin(context, 'https://other.partner-env.example'), CancelError);
            assert.throws(() => lib.resolveOrigin(context, 'https://10.0.0.1'), CancelError);
            assert.throws(() => lib.resolveOrigin(context, 'https://a.evil.example'), CancelError);
        });

        it('checks a separate Token URL the same way', () => {

            assert.strictEqual(lib.resolveTokenUrl(null, ORIGIN, ''), TOKEN_URL);
            assert.strictEqual(lib.resolveTokenUrl(null, ORIGIN, 'https://auth.test.ideas.com/oauth2/token'), 'https://auth.test.ideas.com/oauth2/token');
            assert.throws(() => lib.resolveTokenUrl({ CancelError }, ORIGIN, 'https://evil.example/oauth2/token'), CancelError);
            assert.throws(() => lib.resolveTokenUrl({ CancelError }, ORIGIN, 'https://auth.test.ideas.com/'), CancelError);
        });
    });

    describe('access token', () => {

        it('requests it with the client credentials in a form body, without following redirects', async () => {

            const context = createContext({ responses: [tokenResponse('jwt-a')] });
            const token = await lib.getAccessToken(context);
            assert.strictEqual(token.token, 'jwt-a');
            const [request] = tokenRequests(context);
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.headers['Content-Type'], 'application/x-www-form-urlencoded');
            assert.deepStrictEqual(Object.fromEntries(new URLSearchParams(request.data)), {
                grant_type: 'client_credentials', client_id: 'client-1', client_secret: 'secret-1-do-not-leak'
            });
            assert.strictEqual(request.maxRedirects, 0);
        });

        it('is cached and shared by later messages: one token request for many sends', async () => {

            const cache = {};
            const contexts = [];
            for (let i = 0; i < 3; i++) {
                const context = createContext({ cache, content: { inventories: [INVENTORY_SAMPLE] }, responses: i === 0 ? [tokenResponse('jwt-a')] : [] });
                contexts.push(context);
                await SendInventory.receive(context);
                assert.strictEqual(tokenRequests(context).length, i === 0 ? 1 : 0);
                assert.strictEqual(apiRequests(context)[0].headers.Authorization, 'Bearer jwt-a');
            }
            const key = keyOf();
            // Taken under a lock, and stored encrypted: the shared store holds no usable token.
            assert(contexts.every(context => context.locks.includes(key)));
            // Held longer than a token request may take, and waited for rather than failed.
            assert(contexts[0].lockOptions.ttl > 30 * 1000);
            assert(contexts[0].lockOptions.retryDelay * contexts[0].lockOptions.maxRetryCount > 30 * 1000);
            assert(!JSON.stringify(cache).includes('jwt-a'));
            assert.strictEqual(storedToken(cache).token, 'jwt-a');
            // Another account with the same Client ID cannot read it.
            assert.strictEqual(lib.openToken(lib.account({ auth: { ...ACCOUNT, clientSecret: 'other' } }), cache[key]), null);
        });

        it('keys the cache by token URL, client ID and secret, and never stores the secret in the key', () => {

            const a = lib.account({ auth: ACCOUNT });
            const b = lib.account({ auth: { ...ACCOUNT, clientSecret: 'other' } });
            const c = lib.account({ auth: { ...ACCOUNT, baseUrl: 'https://api.prod.ideasrms.com' } });
            assert.notStrictEqual(lib.tokenCacheKey(a), lib.tokenCacheKey(b));
            assert.notStrictEqual(lib.tokenCacheKey(a), lib.tokenCacheKey(c));
            assert(!lib.tokenCacheKey(a).includes('secret-1'));
            assert(!lib.tokenCacheKey(a).includes('client-1'));
        });

        it('sends no 7th token request within an hour, also when the earlier ones were refused', async () => {

            const cache = {};
            for (let i = 0; i < 6; i++) {
                const context = createContext({ cache, responses: [httpError(401, { error: 'invalid_client' })] });
                await assert.rejects(lib.getAccessToken(context), CancelError);
            }
            const context = createContext({ cache, responses: [tokenResponse()] });
            await assert.rejects(lib.getAccessToken(context), /requested 6 access tokens within an hour/);
            assert.strictEqual(context.requests.length, 0);
        });

        it('forgets requests older than an hour', async () => {

            const cache = {};
            const key = keyOf() + '-requests';
            cache[key] = Array(6).fill(Date.now() - lib.TOKEN_BUDGET_WINDOW_MS - 1000);
            const context = createContext({ cache, responses: [tokenResponse()] });
            await lib.getAccessToken(context);
            assert.strictEqual(tokenRequests(context).length, 1);
            assert.strictEqual(cache[key].length, 1);
        });

        it('replaces a refused token once when it is old enough, and repeats the request', async () => {

            const cache = {};
            cache[keyOf()] = seal('old', Date.now() - 20 * 60 * 1000);
            const context = createContext({ cache, content: { inventories: [INVENTORY_SAMPLE] }, responses: [httpError(403, ''), tokenResponse('new'), { status: 202, data: 't' }] });
            await SendInventory.receive(context);
            const api = apiRequests(context);
            assert.deepStrictEqual(api.map(request => request.headers.Authorization), ['Bearer old', 'Bearer new']);
            assert.strictEqual(storedToken(cache).token, 'new');
        });

        it('does not replace a young refused token: a wrong chain or hotel code must not burn the budget', async () => {

            const cache = {};
            cache[keyOf()] = seal('young', Date.now() - 60 * 1000);
            const context = createContext({ cache, content: { inventories: [INVENTORY_SAMPLE] }, responses: [httpError(403, '')] });
            await assert.rejects(SendInventory.receive(context), /not allowed to send data for this client code and property code/);
            assert.strictEqual(tokenRequests(context).length, 0);
        });

        it('keeps the secret and the token out of error messages', async () => {

            const context = createContext({ responses: [httpError(401, { error: 'invalid_client', error_description: 'Bad client credentials' })] });
            const err = await lib.getAccessToken(context).catch(e => e);
            assert.match(err.message, /did not accept the Client ID and Client Secret.*Bad client credentials/);
            assert(!JSON.stringify({ message: err.message, response: err.response, config: err.config }).includes('secret-1-do-not-leak'));
            assert.strictEqual(err.config, undefined);
        });

        it('takes a token without expires_in as valid for an hour', async () => {

            const context = createContext({ responses: [{ data: { access_token: 'x' } }] });
            const token = await lib.getAccessToken(context);
            assert.strictEqual(token.expiresAt - token.issuedAt, 3600 * 1000);
        });

        it('refuses an answer without an access token', async () => {

            const context = createContext({ responses: [{ data: '<html>login</html>' }] });
            await assert.rejects(lib.getAccessToken(context), /returned no access token/);
        });
    });

    describe('payloads', () => {

        it('turns the documentation sample into the documented types', () => {

            const context = createContext();
            const [item] = lib.buildItems(context, 'reservations', [RESERVATION_SAMPLE], 'corr-x');
            const stay = item.roomStays[0];
            assert.strictEqual(stay.numberOfAdults, 1);
            assert.strictEqual(stay.rates[0].rateValue, 68.87);
            assert.strictEqual(stay.childAgeBuckets[0].minimumAge, 3);
            assert.strictEqual(item.stayRevenue.daily[0].netTotalRevenue, 151.7);
            assert.strictEqual(item.stayRevenue.summary.totalTicketRevenue, 200);
            // Its own correlationId is kept. The sample's nulls are left out: the published schema
            // does not allow them, and the schema validation service rejects the sample with them.
            assert.strictEqual(item.correlationId, '6825ceed2ea6702a68b8e6');
            assert(!('multiReservationId' in item) && !('cancellationDateTime' in item));
            assert(!('context' in item.profiles[0]));
        });

        it('fills in the codes of the account, the Correlation ID and the creation time', () => {

            const context = createContext();
            const [item] = lib.buildItems(context, 'inventories', [INVENTORY_SAMPLE], 'corr-x');
            assert.strictEqual(item.clientCode, 'TESTCLIENT');
            assert.strictEqual(item.propertyCode, 'TESTHOTELCODE');
            assert.strictEqual(item.correlationId, 'corr-x');
            assert.match(item.createDateTime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            assert.strictEqual(item.roomTypeInventories[0].roomsSold, 23);
        });

        it('reports what is wrong, with the path, before anything is sent', async () => {

            const cases = [
                [{ ...INVENTORY_SAMPLE, roomTypeInventories: [] }, /item 1: roomTypeInventories needs at least 1 item/],
                [{ ...INVENTORY_SAMPLE, occupancyDate: '2026-02-30' }, /occupancyDate must be a date/],
                [{ ...INVENTORY_SAMPLE, roomTypeInventories: [{ roomTypeCode: 'DBL', roomTypeCapacity: 1.5, roomsNotAvailableMaintenance: 0, roomsSold: 0 }] }, /roomTypeInventories\[0\]\.roomTypeCapacity must be a whole number/],
                [{ ...INVENTORY_SAMPLE, createDateTime: '2026-12-01 10:00' }, /createDateTime must be a date and time with a time zone/]
            ];
            for (const [item, expected] of cases) {
                const context = createContext({ content: { inventories: [item] } });
                await assert.rejects(SendInventory.receive(context), (err) => err instanceof CancelError && expected.test(err.message));
                assert.strictEqual(context.requests.length, 0);
            }
            const context = createContext({ content: { reservations: [{ ...RESERVATION_SAMPLE, status: 'BOOKED' }] } });
            await assert.rejects(SendReservations.receive(context), /status must be one of RESERVED, CANCELLED/);
            const group = createContext({ content: { groups: [{ ...GROUP_SAMPLE, name: ' ' }] } });
            await assert.rejects(SendGroupBlocks.receive(group), /Group Blocks: item 1: name is required/);
        });

        it('takes a JSON string, an array or one object, and refuses anything else', async () => {

            const context = createContext();
            assert.strictEqual(lib.parseItems(context, JSON.stringify([INVENTORY_SAMPLE]), 'X').length, 1);
            assert.strictEqual(lib.parseItems(context, INVENTORY_SAMPLE, 'X').length, 1);
            assert.throws(() => lib.parseItems(context, '[1, 2]', 'X'), CancelError);
            assert.throws(() => lib.parseItems(context, '[]', 'X'), CancelError);
            assert.throws(() => lib.parseItems(context, '{oops', 'X'), CancelError);
            await assert.rejects(SendInventory.receive(createContext({ content: {} })), /Inventories is required!/);
        });

        it('refuses more than 1,000 inventory items', async () => {

            const context = createContext({ content: { inventories: Array(1001).fill(INVENTORY_SAMPLE) } });
            await assert.rejects(SendInventory.receive(context), /at most 1000 items/);
            assert.strictEqual(context.requests.length, 0);
        });

        it('refuses a Correlation ID that is too long or has line breaks', () => {

            assert.throws(() => lib.correlationId({ CancelError }, 'x'.repeat(129)), CancelError);
            assert.throws(() => lib.correlationId({ CancelError }, 'a\nb'), CancelError);
            assert.match(lib.correlationId({ CancelError }, ''), /^[0-9a-f-]{36}$/);
        });
    });

    describe('sending', () => {

        it('posts the array to the documented path with the token and a ReplyTo header', async () => {

            const context = createContext({ content: { groups: JSON.stringify([GROUP_SAMPLE]), correlationId: 'batch-1' }, responses: [tokenResponse('jwt-g'), { status: 202, data: 'tracker-9' }] });
            await SendGroupBlocks.receive(context);
            const [request] = apiRequests(context);
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.url, ORIGIN + '/api/public/v1/groups');
            assert.strictEqual(request.headers.Authorization, 'Bearer jwt-g');
            assert.strictEqual(request.headers['Content-Type'], 'application/json');
            assert.strictEqual(request.maxRedirects, 0);
            assert(Array.isArray(request.data) && request.data.length === 1);
            assert.strictEqual(request.data[0].groupBlocks[0].pickup, 4);
            assert.match(request.headers.ReplyTo, /^https:\/\/api\.appmixer\.example\/plugins\/appmixer\/ideas\/reply\/flow-1\/component-1\/trackers\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/);
            assert.deepStrictEqual(context.sent, [{ port: 'out', data: { trackerId: 'tracker-9', statusCode: 202, correlationId: 'batch-1', count: 1, responseBody: 'tracker-9' } }]);
        });

        it('takes any 2xx as accepted: 201, 202 with a JSON object, 204 without a body', async () => {

            for (const [response, trackerId] of [
                [{ status: 201, data: '"7a1c"' }, '7a1c'],
                [{ status: 202, data: { responses: '202', description: 'Accepted' } }, ''],
                [{ status: 204, data: '' }, '']
            ]) {
                const context = createContext({ content: { inventories: [INVENTORY_SAMPLE] }, responses: [tokenResponse(), response] });
                await SendInventory.receive(context);
                assert.strictEqual(context.sent[0].port, 'out');
                assert.strictEqual(context.sent[0].data.statusCode, response.status);
                assert.strictEqual(context.sent[0].data.trackerId, trackerId);
            }
        });

        it('turns error answers into the connector\'s messages', async () => {

            const cases = [
                [httpError(400, { error: 'Bad Request', message: 'roomStays[0].rateCode must not be blank', status: 400 }), CancelError, /rejected the request as invalid.*rateCode must not be blank/],
                [httpError(408, ''), CancelError, /smaller batches/],
                [httpError(429, '', { 'retry-after': '30' }), Error, /too many.*Retry after 30/],
                [httpError(500, { error: 'Internal Server Error', message: 'boom' }), Error, /IDeaS API request failed.*HTTP 500: boom/]
            ];
            for (const [error, type, expected] of cases) {
                const context = createContext({ content: { inventories: [INVENTORY_SAMPLE] }, responses: [tokenResponse(), error] });
                const err = await SendInventory.receive(context).catch(e => e);
                assert(err instanceof type, err.message);
                if (type === Error) {
                    assert(!(err instanceof CancelError), 'a server error is retried, not cancelled');
                }
                assert.match(err.message, expected);
                assert.strictEqual(err.config, undefined);
                assert.strictEqual(context.sent.length, 0);
            }
        });

        it('sends nothing but the payload to the schema validation service and reads its violations', async () => {

            const violations = JSON.stringify([{ location: ['request', 'body', '0'], severity: 'Error', code: 'required', message: 'Request body property 0 must have required property \'propertyCode\'' }]);
            const context = createContext({
                account: { ...ACCOUNT, baseUrl: MOCK_ORIGIN },
                content: { inventories: [INVENTORY_SAMPLE] },
                responses: [{ status: 202, data: { status: 'success' } }, httpError(500, { title: 'Cannot find serializer for */*' }, { 'sl-violations': violations })]
            });
            await SendInventory.receive(context);
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.requests[0].url, MOCK_ORIGIN + '/api/public/v1/inventories');
            assert.strictEqual(context.requests[0].headers.Authorization, undefined);
            assert.strictEqual(context.sent[0].data.trackerId, '');
            context.sent = [];
            const err = await SendInventory.receive(context).catch(e => e);
            assert(err instanceof CancelError);
            assert.match(err.message, /schema validation service rejected the payload: request\.body\.0: .*'propertyCode'/);
        });
    });

    describe('processing result (ReplyTo)', () => {

        it('the route hands a reply over to the component with the scope of the message that sent the data', async () => {

            const { replyUrl } = await submitInventory();
            const token = tokenOf(replyUrl);
            const calls = [];
            const plugin = {
                async log() {},
                async triggerComponent(...args) {
                    calls.push(args);
                    return { statusCode: 200, body: {} };
                }
            };
            const result = await routes.handleReply(plugin, { params: { flowId: 'flow-1', componentId: 'component-1', token, trackerId: 'tr-5' }, payload: { status: 'SUCCESS' } });
            assert.strictEqual(result.statusCode, 200);
            assert.deepStrictEqual(calls, [['flow-1', 'component-1', { ideasReply: { token, trackerId: 'tr-5', body: { status: 'SUCCESS' } } }, { correlationId: 'corr-1', correlationInPort: 'in', messageId: 'msg-1' }, {}]]);
        });

        it('the route reads a body sent as text/plain as JSON', async () => {

            const { replyUrl } = await submitInventory();
            const calls = [];
            const plugin = { async log() {}, async triggerComponent(...args) { calls.push(args); return { statusCode: 200, body: {} }; } };
            await routes.handleReply(plugin, { params: { flowId: 'flow-1', componentId: 'component-1', token: tokenOf(replyUrl) }, payload: Buffer.from('{"status":"FAILED","description":"x"}') });
            assert.deepStrictEqual(calls[0][2].ideasReply.body, { status: 'FAILED', description: 'x' });
        });

        it('the route answers 404 for a malformed token, a bad id or a stopped flow, and passes nothing on', async () => {

            let called = 0;
            const plugin = { async log() {}, async triggerComponent() { called++; return { statusCode: 400, body: { message: 'Flow stopped.' } }; } };
            for (const params of [
                { flowId: 'flow-1', componentId: 'component-1', token: 'garbage' },
                { flowId: 'flow-1', componentId: 'component-1', token: 'eyJ2IjoxfQ.short' },
                { flowId: '../x', componentId: 'component-1', token: 'a.' + 'b'.repeat(43) }
            ]) {
                assert.strictEqual((await routes.handleReply(plugin, { params, payload: {} })).statusCode, 404);
            }
            assert.strictEqual(called, 0);
            const { replyUrl } = await submitInventory();
            const result = await routes.handleReply(plugin, { params: { flowId: 'flow-1', componentId: 'component-1', token: tokenOf(replyUrl) }, payload: { status: 'SUCCESS' } });
            assert.strictEqual(result.statusCode, 404);
        });

        it('emits SUCCESS on done with the Correlation ID of the message, and answers 200', async () => {

            const { replyUrl } = await submitInventory();
            const context = createContext({ webhook: webhookContent(tokenOf(replyUrl), { status: 'SUCCESS' }, undefined, 'tr-5') });
            await SendInventory.receive(context);
            assert.deepStrictEqual(context.sent, [{ port: 'done', data: { status: 'SUCCESS', trackerId: 'tr-5', correlationId: 'batch-7', count: 1, messages: [], message: '' } }]);
            assert.deepStrictEqual(context.responses, [{ body: {}, statusCode: 200 }]);
        });

        it('emits FAILED with the messages of the Tracker API, and the description of the message flow diagram', async () => {

            const { replyUrl } = await submitInventory();
            const token = tokenOf(replyUrl);
            const tracker = createContext({ webhook: webhookContent(token, { status: 'FAILED', messages: [{ code: 'E1', text: 'Unknown room type DBL' }, { code: 'E2', text: 'Capacity exceeded' }] }) });
            await SendInventory.receive(tracker);
            assert.strictEqual(tracker.sent[0].port, 'done');
            assert.strictEqual(tracker.sent[0].data.status, 'FAILED');
            assert.deepStrictEqual(tracker.sent[0].data.messages, [{ code: 'E1', text: 'Unknown room type DBL' }, { code: 'E2', text: 'Capacity exceeded' }]);
            assert.strictEqual(tracker.sent[0].data.message, 'Unknown room type DBL; Capacity exceeded');

            const diagram = createContext({ webhook: webhookContent(token, { status: 'failed', description: 'Invalid market segment' }) });
            await SendInventory.receive(diagram);
            assert.strictEqual(diagram.sent[0].data.status, 'FAILED');
            assert.strictEqual(diagram.sent[0].data.message, 'Invalid market segment');
        });

        it('answers 400 for a reply without a status and sends nothing on', async () => {

            const { replyUrl } = await submitInventory();
            const context = createContext({ webhook: webhookContent(tokenOf(replyUrl), { description: 'x' }) });
            await SendInventory.receive(context);
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.responses[0].statusCode, 400);
        });

        it('acknowledges even when the emit fails, so IDeaS does not deliver again', async () => {

            const { replyUrl } = await submitInventory();
            const context = createContext({ webhook: webhookContent(tokenOf(replyUrl), { status: 'SUCCESS' }) });
            context.sendJson = async () => {
                throw new Error('queue down');
            };
            await assert.rejects(SendInventory.receive(context), /queue down/);
            assert.deepStrictEqual(context.responses, [{ body: {}, statusCode: 200 }]);
        });

        it('a request posted straight to the component\'s webhook URL is refused without a valid token', async () => {

            for (const content of [
                { method: 'POST', data: { status: 'SUCCESS' }, query: {} },
                { method: 'POST', data: { ideasReply: { token: 'forged.' + 'A'.repeat(43), body: { status: 'SUCCESS' } } }, query: {} },
                { method: 'POST', data: null, query: {} }
            ]) {
                const context = createContext({ webhook: content });
                await SendInventory.receive(context);
                assert.strictEqual(context.sent.length, 0);
                assert.strictEqual(context.responses[0].statusCode, 404);
            }
        });

        it('a token whose payload was changed is refused', async () => {

            const { replyUrl } = await submitInventory();
            const [body, mac] = tokenOf(replyUrl).split('.');
            const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
            const forged = Buffer.from(JSON.stringify({ ...payload, u: 'someone-else' })).toString('base64url') + '.' + mac;
            const context = createContext({ webhook: webhookContent(forged, { status: 'SUCCESS' }) });
            await SendInventory.receive(context);
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.responses[0].statusCode, 404);
        });

        it('a token is good only for the component and the account that made it', async () => {

            const { replyUrl } = await submitInventory();
            const token = tokenOf(replyUrl);
            const cases = [
                // Another account of the same tenant, even with the same Client ID.
                createContext({ account: { ...ACCOUNT, clientSecret: 'secret-2' }, webhook: webhookContent(token, { status: 'SUCCESS' }) }),
                createContext({ account: { ...ACCOUNT, clientId: 'client-2' }, webhook: webhookContent(token, { status: 'SUCCESS' }) }),
                // Another component or flow.
                createContext({ componentId: 'component-2', webhook: webhookContent(token, { status: 'SUCCESS' }) }),
                createContext({ flowId: 'flow-2', webhook: webhookContent(token, { status: 'SUCCESS' }) }),
                // Another message's scope.
                createContext({ webhook: webhookContent(token, { status: 'SUCCESS' }, { correlationId: 'corr-2', correlationInPort: 'in', messageId: 'msg-2' }) })
            ];
            for (const context of cases) {
                await SendInventory.receive(context);
                assert.strictEqual(context.sent.length, 0);
                assert.strictEqual(context.responses[0].statusCode, 404);
            }
            // Another Send component of the same flow: the token names its kind.
            const other = createContext({ webhook: webhookContent(token, { status: 'SUCCESS' }) });
            await SendReservations.receive(other);
            assert.strictEqual(other.sent.length, 0);
            assert.strictEqual(other.responses[0].statusCode, 404);
            // The token is never logged.
            assert(!JSON.stringify(other.logs).includes(token));
        });

        it('a token older than the reply window is refused', () => {

            const acc = lib.account({ auth: ACCOUNT });
            const token = lib.signReplyToken(acc, 'flow-1', 'component-1', { v: 1, t: Date.now() - lib.REPLY_VALIDITY_MS - 1000, c: '', p: '', m: '', k: 'inventories', n: 1, u: 'x' });
            assert.throws(() => lib.verifyReplyToken(acc, 'flow-1', 'component-1', token), /expired/);
        });
    });

    describe('Make API Call', () => {

        it('sends to the account host only, with the token, and drops a user Authorization header', async () => {

            const context = createContext({ content: { url: '/api/public/v1/inventories', method: 'POST', headers: JSON.stringify({ authorization: 'Bearer stolen', ReplyTo: 'https://my.example/reply' }), body: '[]' }, responses: [tokenResponse('jwt-m'), { status: 202, data: 'x' }] });
            await MakeApiCall.receive(context);
            const [request] = apiRequests(context);
            assert.strictEqual(request.url, ORIGIN + '/api/public/v1/inventories');
            assert.strictEqual(request.headers.Authorization, 'Bearer jwt-m');
            assert.strictEqual(request.headers.authorization, undefined);
            assert.strictEqual(request.headers.ReplyTo, 'https://my.example/reply');
            assert.deepStrictEqual(context.sent[0], { port: 'out', data: { statusCode: 202, headers: {}, body: 'x' } });
        });

        it('refuses any other origin before a token is requested', async () => {

            for (const url of ['https://evil.example/x', '//evil.example/x', 'http://api.test.ideasrms.com/x', 'https://api.test.ideasrms.com@evil.example/x', 'https://api.prod.ideasrms.com/x']) {
                const context = createContext({ content: { url, method: 'GET' } });
                await assert.rejects(MakeApiCall.receive(context), CancelError, url);
                assert.strictEqual(context.requests.length, 0, url);
            }
        });
    });

    describe('auth.js', () => {

        it('validates the credentials with one token request', async () => {

            const context = createAuthContext(ACCOUNT);
            assert.strictEqual(await auth.definition.validate(context), true);
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.requests[0].url, TOKEN_URL);
        });

        it('marks refused credentials, a foreign host and missing codes as invalid', async () => {

            await assert.rejects(auth.definition.validate(createAuthContext(ACCOUNT, [httpError(401, { error: 'invalid_client' })])), InvalidTokenError);
            const foreign = createAuthContext({ ...ACCOUNT, baseUrl: 'https://evil.example' });
            await assert.rejects(auth.definition.validate(foreign), InvalidTokenError);
            assert.strictEqual(foreign.requests.length, 0);
            await assert.rejects(auth.definition.validate(createAuthContext({ ...ACCOUNT, propertyCode: '' })), InvalidTokenError);
        });

        it('does not mark the account invalid for an outage', async () => {

            const err = await auth.definition.validate(createAuthContext(ACCOUNT, [httpError(503, '')])).catch(e => e);
            assert(!(err instanceof InvalidTokenError));
        });

        it('accepts the schema validation service without a request', async () => {

            const context = createAuthContext({ ...ACCOUNT, baseUrl: MOCK_ORIGIN });
            assert.strictEqual(await auth.definition.validate(context), true);
            assert.strictEqual(context.requests.length, 0);
        });

        it('names the account after its codes', () => {

            assert.deepStrictEqual(auth.definition.requestProfileInfo(ACCOUNT), { name: 'TESTCLIENT / TESTHOTELCODE' });
        });
    });
});
