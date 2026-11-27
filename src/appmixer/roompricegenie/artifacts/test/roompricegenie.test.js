'use strict';

/* eslint-disable max-len */

const assert = require('assert');
const crypto = require('crypto');

const lib = require('../../lib');
const jwt = require('../../jwt');
const auth = require('../../auth');
const routes = require('../../routes');

const SendInventory = require('../../core/SendInventory/SendInventory');
const SendAvailability = require('../../core/SendAvailability/SendAvailability');
const SendRates = require('../../core/SendRates/SendRates');
const SendRestrictions = require('../../core/SendRestrictions/SendRestrictions');
const SendReservations = require('../../core/SendReservations/SendReservations');
const CreateAccount = require('../../core/CreateAccount/CreateAccount');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const NewRateUpdate = require('../../core/NewRateUpdate/NewRateUpdate');
const NewRestrictionUpdate = require('../../core/NewRestrictionUpdate/NewRestrictionUpdate');

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
// The host is the development host of RoomPriceGenie's published Postman collection.
const ORIGIN = 'https://refactoringdevapi.roompricegenie.com';
const PARTNER_API_KEY = 'partner-key-1';
const CONFIG = { baseUrl: ORIGIN, partnerApiKey: PARTNER_API_KEY };
const ACCOUNT = { propertyCode: 'HOTEL123', clientId: 'client-hotel123', clientSecret: 'secret-hotel123' };
const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const tokenResponse = (accessToken = 'access-1', extra = {}) => ({
    data: { expires_in: 86400, access_token: accessToken, token_type: 'Bearer', refresh_token: 'refresh-1', refresh_token_expires_in: 604800, ...extra }
});

const httpError = (status, data) => Object.assign(new Error('Request failed with status code ' + status), {
    response: { status, data, headers: {} }
});

// A response that is an Error makes httpRequest reject with it. A function is called with the request.
const createContext = ({ auth: account = ACCOUNT, config = CONFIG, content = {}, responses = [], webhook, cache = {} } = {}) => {

    const context = {
        auth: account,
        config,
        componentId: 'component-1',
        flowId: 'flow-1',
        messages: webhook !== undefined ? { webhook: { content: { data: webhook } } } : { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        cache,
        cacheTtl: {},
        locks: [],
        listeners: [],
        removed: [],
        async httpRequest(options) {
            this.requests.push(options);
            let next = responses.length ? responses.shift() : { data: {} };
            if (typeof next === 'function') {
                next = next(options);
            }
            if (next instanceof Error) {
                throw next;
            }
            return { status: 200, headers: {}, ...next };
        },
        async sendJson(data, port) {
            this.sent.push({ data, port });
        },
        async lock(key) {
            context.locks.push(key);
            return { async unlock() {} };
        },
        staticCache: {
            get: async key => context.cache[key],
            set: async (key, value, ttl) => {
                context.cache[key] = value;
                context.cacheTtl[key] = ttl;
            }
        },
        async addListener(eventName, params) {
            this.listeners.push({ eventName, params });
        },
        async removeListener(eventName) {
            this.removed.push(eventName);
        }
    };
    return context;
};

// The context auth.js callbacks get: the fields sit on the context, there is no "auth" and no CancelError.
const createAuthContext = (fields, responses = [], config = CONFIG) => ({
    ...fields,
    config,
    InvalidTokenError,
    requests: [],
    async httpRequest(options) {
        this.requests.push(options);
        const next = responses.length ? responses.shift() : { data: {} };
        if (next instanceof Error) {
            throw next;
        }
        return { status: 200, headers: {}, ...next };
    }
});

const eventRequests = (context) => context.requests.filter(request => request.url === ORIGIN + '/integrations/api/v1/event/');
const tokenRequests = (context) => context.requests.filter(request => request.url === ORIGIN + '/integrations/token/');

// --- RoomPriceGenie's side of the inbound exchange, played by keys generated here -----------------

const b64url = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

const signRs256 = (privateKey, payload, header = {}) => {

    const signingInput = `${b64url({ alg: 'RS256', typ: 'JWT', ...header })}.${b64url(payload)}`;
    const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey).toString('base64url');
    return `${signingInput}.${signature}`;
};

const toJwk = (publicKey, kid) => ({ ...publicKey.export({ format: 'jwk' }), kid, key_ops: ['verify'] });

const listener = (eventName, propertyCode, clientId, url = `https://appmixer.example/flows/f/components/${clientId}`) => ({
    eventName, url, params: { propertyCode, clientId }
});

// The plugin context of routes.js. triggerListeners applies the filter the way the engine does.
const createPluginContext = ({ listeners = [], config = CONFIG, jwks } = {}) => {

    const context = {
        config,
        listeners,
        jwks,
        jwksFailure: null,
        delivered: [],
        logs: [],
        requests: [],
        registered: [],
        listenerCallbacks: [],
        async httpRequest(options) {
            this.requests.push(options);
            if (this.jwksFailure) {
                throw this.jwksFailure;
            }
            return { status: 200, headers: {}, data: typeof this.jwks === 'function' ? this.jwks() : this.jwks };
        },
        async getListeners(eventName, filter) {
            const found = this.listeners.filter(item => item.eventName === eventName);
            return filter ? found.filter(filter) : found;
        },
        async triggerListeners({ eventName, payload, filter }) {
            const targets = await this.getListeners(eventName, filter);
            this.delivered.push({ eventName, payload, urls: targets.map(item => item.url) });
        },
        onListenerAdded(callback) {
            this.listenerCallbacks.push(callback);
        },
        async log(level, message, data) {
            this.logs.push({ level, message, data });
        },
        http: {
            router: {
                register(route) {
                    context.registered.push(route);
                }
            }
        }
    };
    return context;
};

describe('roompricegenie', () => {

    let rpg; // RoomPriceGenie's current signing key
    let rpgNext; // a key RoomPriceGenie rotates in later
    let attacker; // somebody else's key
    let weak; // a 1024 bit key

    before(function() {
        this.timeout(30000);
        rpg = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
        rpgNext = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
        attacker = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
        weak = crypto.generateKeyPairSync('rsa', { modulusLength: 1024 });
    });

    beforeEach(() => routes.resetKeyStores());

    const nowSeconds = () => Math.floor(Date.now() / 1000);

    // The claims RoomPriceGenie documents for the token of a pushed update.
    const claims = (overrides = {}) => ({
        iss: 'RoomPriceGenie',
        sub: '423',
        aud: ['HOTEL123'],
        client_id: 'client-hotel123',
        exp: nowSeconds() + 86400,
        iat: nowSeconds() - 5,
        jti: '9f3c1b7e4d2a4f6b8c0e1a2b3c4d5e6f',
        partner_id: '423',
        property_code: ['HOTEL123'],
        ...overrides
    });

    const jwks = () => ({
        key: [toJwk(rpg.publicKey, 'kid-1')],
        info: [{ kid: 'kid-1', expiry_date: '2099-01-01T00:00:00Z' }]
    });

    const validToken = (overrides) => signRs256(rpg.privateKey, claims(overrides), { kid: 'kid-1' });

    // The "Upload Rates" example of the documentation.
    const ratesPush = () => ({
        event: 'rates.update',
        tracking_id: 'eec4776f-3b5c-484a-aa02-f8c525d5b706',
        property_code: 'HOTEL123',
        data: [
            {
                room_type_code: 'DBL',
                room_type_name: 'Double Room',
                rate_plan_code: 'BAR',
                rate_plan_name: 'Best Available Rate',
                calendar: [
                    { start_date: '2024-01-01', end_date: '2024-01-01', price: 100 },
                    { start_date: '2024-01-02', end_date: '2024-01-07', prices: [{ occupancy: 1, price: 120 }, { occupancy: 2, price: 150 }] }
                ]
            },
            {
                room_type_code: 'DBL',
                room_type_name: 'Double Room',
                rate_plan_code: 'NONREF',
                rate_plan_name: 'Non Refundable',
                calendar: [{ start_date: '2024-01-01', end_date: '2024-01-01', price: 90 }]
            }
        ]
    });

    const restrictionsPush = () => ({
        event: 'restrictions.update',
        tracking_id: 'd3095e42-8d6e-4bb4-b452-7f06f2154589',
        property_code: 'HOTEL123',
        data: [{
            room_type_code: 'DBL',
            room_type_name: 'Double Room',
            calendar: [{ start_date: '2024-01-02', end_date: '2024-01-07', min_stay_arrival: 2 }]
        }]
    });

    const push = (context, payload, token, headers = {}) => routes.handleEvent(context, {
        headers: {
            'content-type': 'application/json',
            'x-api-key': PARTNER_API_KEY,
            ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
            ...headers
        },
        payload
    });

    const assertRejected = (result, status = 401) => {
        assert.strictEqual(result.statusCode, status);
        assert(Array.isArray(result.body.errors) && result.body.errors.length === 1);
    };

    describe('API base URL', () => {

        it('accepts an HTTPS host under roompricegenie.com and returns its origin', () => {
            assert.strictEqual(lib.resolveOrigin('https://refactoringdevapi.roompricegenie.com'), ORIGIN);
            assert.strictEqual(lib.resolveOrigin(' https://API.RoomPriceGenie.com/ '), 'https://api.roompricegenie.com');
            assert.strictEqual(lib.resolveOrigin('https://a.b.roompricegenie.com'), 'https://a.b.roompricegenie.com');
        });

        const refused = {
            'plain HTTP': 'http://api.roompricegenie.com',
            'another host': 'https://api.example.com',
            'a host that only ends with the name': 'https://evilroompricegenie.com',
            'the name as a subdomain of another host': 'https://api.roompricegenie.com.evil.example',
            'the name as the user part': 'https://api.roompricegenie.com@evil.example',
            'a backslash before the name': 'https://evil.example\\.roompricegenie.com',
            'credentials in the URL': 'https://user:pass@api.roompricegenie.com',
            'a port': 'https://api.roompricegenie.com:8443',
            'a path': 'https://api.roompricegenie.com/integrations',
            'a query': 'https://api.roompricegenie.com/?next=https://evil.example',
            'the bare domain': 'https://roompricegenie.com',
            'a trailing dot': 'https://api.roompricegenie.com.',
            'a bare host name': 'api.roompricegenie.com',
            'another scheme': 'ftp://api.roompricegenie.com',
            'an empty value': '',
            'a non-string': { href: 'https://api.roompricegenie.com' }
        };
        for (const [name, value] of Object.entries(refused)) {
            it(`refuses ${name}`, () => {
                assert.throws(() => lib.resolveOrigin(value), /base URL/);
            });
        }

        it('a component makes no request at all when the configured base URL is not a RoomPriceGenie host', async () => {
            const context = createContext({
                config: { baseUrl: 'https://api.roompricegenie.com.evil.example', partnerApiKey: PARTNER_API_KEY },
                content: { roomTypeCode: 'DBL', roomTypeName: 'Double Room', startDate: '2027-01-01', endDate: '2027-01-02', roomsLeft: 3 }
            });
            await assert.rejects(SendAvailability.receive(context), (err) => err instanceof CancelError && /roompricegenie\.com/.test(err.message));
            assert.strictEqual(context.requests.length, 0);
        });

        it('a component makes no request when the Partner API Key is not configured', async () => {
            const context = createContext({ config: { baseUrl: ORIGIN }, content: { url: '/integrations/api/v1/event/', method: 'GET' } });
            await assert.rejects(MakeApiCall.receive(context), /Partner API Key is not set/);
            assert.strictEqual(context.requests.length, 0);
        });
    });

    describe('account', () => {

        it('is validated with the client credentials grant: form-encoded, with the Partner API Key', async () => {
            const context = createAuthContext(ACCOUNT, [tokenResponse()]);
            assert.strictEqual(await auth.definition.validate(context), true);
            assert.strictEqual(context.requests.length, 1);
            const request = context.requests[0];
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.url, ORIGIN + '/integrations/token/');
            assert.strictEqual(request.headers['Content-Type'], 'application/x-www-form-urlencoded');
            assert.strictEqual(request.headers['X-API-Key'], PARTNER_API_KEY);
            assert.strictEqual(request.maxRedirects, 0);
            assert.deepStrictEqual(Object.fromEntries(new URLSearchParams(request.data)), {
                grant_type: 'client_credentials', client_id: 'client-hotel123', client_secret: 'secret-hotel123'
            });
        });

        it('is named after its property code', () => {
            assert.deepStrictEqual(auth.definition.requestProfileInfo(createAuthContext(ACCOUNT)), { name: 'HOTEL123' });
            assert.strictEqual(auth.definition.accountNameFromProfileInfo, 'name');
        });

        it('refused credentials mark the account as invalid', async () => {
            for (const status of [400, 401, 403]) {
                const context = createAuthContext(ACCOUNT, [httpError(status, { error: 'invalid_client', error_description: 'Client authentication failed.' })]);
                await assert.rejects(auth.definition.validate(context), (err) => err instanceof InvalidTokenError && /Client authentication failed/.test(err.message));
            }
        });

        it('an outage or a rate limit does not mark the account as invalid', async () => {
            for (const failure of [httpError(500, {}), httpError(429, {}), new Error('socket hang up')]) {
                const context = createAuthContext(ACCOUNT, [failure]);
                await assert.rejects(auth.definition.validate(context), (err) => !(err instanceof InvalidTokenError));
            }
        });

        it('needs all three fields, and asks nothing of RoomPriceGenie without them', async () => {
            for (const field of ['propertyCode', 'clientId', 'clientSecret']) {
                const context = createAuthContext({ ...ACCOUNT, [field]: ' ' });
                await assert.rejects(auth.definition.validate(context), InvalidTokenError);
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('makes no request when the connector configuration is missing or names another host, and stays valid', async () => {
            for (const config of [{}, { baseUrl: ORIGIN }, { baseUrl: 'https://evil.example', partnerApiKey: PARTNER_API_KEY }]) {
                const context = createAuthContext(ACCOUNT, [], config);
                await assert.rejects(auth.definition.validate(context), (err) => !(err instanceof InvalidTokenError) && /appmixer:roompricegenie/.test(err.message));
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('is refused when the access token names another property code', async () => {
            const token = `${b64url({ alg: 'RS256' })}.${b64url({ aud: ['OTHER'] })}.c2ln`;
            const context = createAuthContext(ACCOUNT, [tokenResponse(token)]);
            await assert.rejects(auth.definition.validate(context), (err) => err instanceof InvalidTokenError && /another property code/.test(err.message));
        });

        it('is accepted when the access token names its property code, or none', async () => {
            const named = `${b64url({ alg: 'RS256' })}.${b64url({ aud: ['HOTEL123'] })}.c2ln`;
            assert.strictEqual(await auth.definition.validate(createAuthContext(ACCOUNT, [tokenResponse(named)])), true);
            assert.strictEqual(await auth.definition.validate(createAuthContext(ACCOUNT, [tokenResponse('opaque-token')])), true);
        });
    });

    describe('access token', () => {

        const availability = { roomTypeCode: 'DBL', roomTypeName: 'Double Room', startDate: '2027-01-01', endDate: '2027-01-02', roomsLeft: 3 };

        it('is requested once and reused from the cache', async () => {
            const cache = {};
            const first = createContext({ cache, content: availability, responses: [tokenResponse(), { data: {} }] });
            await SendAvailability.receive(first);
            assert.strictEqual(tokenRequests(first).length, 1);
            assert.strictEqual(eventRequests(first)[0].headers.Authorization, 'Bearer access-1');
            assert.strictEqual(eventRequests(first)[0].headers['X-API-Key'], PARTNER_API_KEY);

            const second = createContext({ cache, content: availability });
            await SendAvailability.receive(second);
            assert.strictEqual(tokenRequests(second).length, 0);
            assert.strictEqual(second.requests.length, 1);
            assert.strictEqual(second.requests[0].headers.Authorization, 'Bearer access-1');
        });

        it('is cached for as long as the refresh token lives, under a lock', async () => {
            const context = createContext({ content: availability, responses: [tokenResponse()] });
            await SendAvailability.receive(context);
            const key = lib.tokenCacheKey(context);
            assert.deepStrictEqual(context.locks, [key]);
            assert(context.cacheTtl[key] > 6.9 * 24 * 3600 * 1000 && context.cacheTtl[key] <= 7 * 24 * 3600 * 1000);
            assert.strictEqual(context.cache[key].refreshToken, 'refresh-1');
        });

        it('has a cache key per account, host and Partner API Key; the key holds no secret', () => {
            const key = (account, config) => lib.tokenCacheKey(createContext({ auth: account, config }));
            const base = key(ACCOUNT, CONFIG);
            assert.notStrictEqual(key({ ...ACCOUNT, clientId: 'client-other' }, CONFIG), base);
            assert.notStrictEqual(key({ ...ACCOUNT, clientSecret: 'wrong-secret' }, CONFIG), base);
            assert.notStrictEqual(key(ACCOUNT, { ...CONFIG, partnerApiKey: 'partner-key-2' }), base);
            assert.notStrictEqual(key(ACCOUNT, { ...CONFIG, baseUrl: 'https://api.roompricegenie.com' }), base);
            assert.strictEqual(key({ ...ACCOUNT }, { ...CONFIG }), base);
            assert(!base.includes('secret-hotel123') && !base.includes(PARTNER_API_KEY) && !base.includes('client-hotel123'));
        });

        it('an account with the same client id and another secret does not get the cached token', async () => {
            const cache = {};
            await SendAvailability.receive(createContext({ cache, content: availability, responses: [tokenResponse()] }));
            const other = createContext({
                cache,
                auth: { ...ACCOUNT, clientSecret: 'guessed' },
                content: availability,
                responses: [httpError(401, { error: 'invalid_client' })]
            });
            await assert.rejects(SendAvailability.receive(other), CancelError);
            assert.strictEqual(tokenRequests(other).length, 1);
            assert.strictEqual(eventRequests(other).length, 0);
        });

        it('an expired access token is renewed with the refresh token', async () => {
            const context = createContext({ content: availability, responses: [tokenResponse('access-2', { refresh_token: 'refresh-2' })] });
            context.cache[lib.tokenCacheKey(context)] = {
                accessToken: 'access-old', expiresAt: Date.now() - 1000, refreshToken: 'refresh-old', refreshExpiresAt: Date.now() + 3600 * 1000
            };
            await SendAvailability.receive(context);
            assert.deepStrictEqual(Object.fromEntries(new URLSearchParams(tokenRequests(context)[0].data)), {
                grant_type: 'refresh_token', client_id: 'client-hotel123', refresh_token: 'refresh-old'
            });
            assert.strictEqual(tokenRequests(context).length, 1);
            assert.strictEqual(eventRequests(context)[0].headers.Authorization, 'Bearer access-2');
            assert.strictEqual(context.cache[lib.tokenCacheKey(context)].refreshToken, 'refresh-2');
        });

        it('a refused refresh token falls back to the client credentials', async () => {
            const context = createContext({ content: availability, responses: [httpError(400, { error: 'invalid_grant' }), tokenResponse('access-3')] });
            context.cache[lib.tokenCacheKey(context)] = {
                accessToken: 'access-old', expiresAt: Date.now() - 1000, refreshToken: 'refresh-dead', refreshExpiresAt: Date.now() + 3600 * 1000
            };
            await SendAvailability.receive(context);
            const grants = tokenRequests(context).map(request => new URLSearchParams(request.data).get('grant_type'));
            assert.deepStrictEqual(grants, ['refresh_token', 'client_credentials']);
            assert.strictEqual(eventRequests(context)[0].headers.Authorization, 'Bearer access-3');
        });

        it('an expired refresh token is not sent at all', async () => {
            const context = createContext({ content: availability, responses: [tokenResponse('access-4')] });
            context.cache[lib.tokenCacheKey(context)] = {
                accessToken: 'access-old', expiresAt: Date.now() - 1000, refreshToken: 'refresh-expired', refreshExpiresAt: Date.now() - 1
            };
            await SendAvailability.receive(context);
            assert.strictEqual(new URLSearchParams(tokenRequests(context)[0].data).get('grant_type'), 'client_credentials');
        });

        it('an outage during the refresh is not answered with more token requests', async () => {
            const context = createContext({ content: availability, responses: [httpError(503, {})] });
            context.cache[lib.tokenCacheKey(context)] = {
                accessToken: 'access-old', expiresAt: Date.now() - 1000, refreshToken: 'refresh-old', refreshExpiresAt: Date.now() + 3600 * 1000
            };
            await assert.rejects(SendAvailability.receive(context), (err) => !(err instanceof CancelError));
            assert.strictEqual(context.requests.length, 1);
        });

        it('a 401 for a cached token renews it and sends the request once more', async () => {
            const context = createContext({ content: availability, responses: [httpError(401, { error: 'invalid_token' }), tokenResponse('access-5'), { data: {} }] });
            context.cache[lib.tokenCacheKey(context)] = { accessToken: 'access-revoked', expiresAt: Date.now() + 3600 * 1000, refreshToken: '', refreshExpiresAt: 0 };
            await SendAvailability.receive(context);
            assert.deepStrictEqual(eventRequests(context).map(request => request.headers.Authorization), ['Bearer access-revoked', 'Bearer access-5']);
            assert.strictEqual(context.sent.length, 1);
        });

        it('a second 401 stops the message', async () => {
            const context = createContext({ content: availability, responses: [tokenResponse('access-6'), httpError(401, {}), tokenResponse('access-7'), httpError(401, { error_description: 'Token is invalid.' })] });
            await assert.rejects(SendAvailability.receive(context), (err) => err instanceof CancelError && /HTTP 401: Token is invalid/.test(err.message));
            assert.strictEqual(eventRequests(context).length, 2);
        });

        it('a network error of the token request is not passed on with the request it carries', async () => {
            // What axios throws without a response: the error holds the request config.
            const networkError = Object.assign(new Error('connect ECONNREFUSED'), {
                isAxiosError: true,
                config: { headers: { 'X-API-Key': PARTNER_API_KEY }, data: 'client_secret=secret-hotel123' }
            });
            const context = createContext({ content: availability, responses: [networkError] });
            await assert.rejects(SendAvailability.receive(context), (err) => {
                return err !== networkError && err.config === undefined && /ECONNREFUSED/.test(err.message) && !(err instanceof CancelError);
            });
            const authContext = createAuthContext(ACCOUNT, [networkError]);
            await assert.rejects(auth.definition.validate(authContext), (err) => err !== networkError && err.config === undefined && !(err instanceof InvalidTokenError));
        });

        it('an answer without an access token is an error, and nothing is cached', async () => {
            const context = createContext({ content: availability, responses: [{ data: {} }] });
            await assert.rejects(SendAvailability.receive(context), /no access token/);
            assert.deepStrictEqual(context.cache, {});
            assert.strictEqual(eventRequests(context).length, 0);
        });
    });

    describe('events sent to RoomPriceGenie', () => {

        const cachedToken = (context) => {
            context.cache[lib.tokenCacheKey(context)] = { accessToken: 'access-1', expiresAt: Date.now() + 3600 * 1000, refreshToken: '', refreshExpiresAt: 0 };
            return context;
        };
        const run = async (component, content, responses = []) => {
            const context = cachedToken(createContext({ content, responses }));
            await component.receive(context);
            return context;
        };
        const bodyOf = (context) => context.requests[0].data;

        it('Send Inventory sends the documented inventory.update', async () => {
            const context = await run(SendInventory, {
                roomTypes: JSON.stringify([
                    { room_type_code: 'SGL', room_type_name: 'Single Room', default_occupancy: 2, min_occupancy: 2, max_occupancy: 3, number_of_rooms: 11 },
                    { room_type_code: 'DBL', room_type_name: 'Double Room', number_of_rooms: '10' }
                ]),
                ratePlans: [{ rate_plan_code: 'BAR', rate_plan_name: 'Best Available Rate', room_type_code: 'SGL' }]
            }, [{ data: { event: 'inventory.update', tracking_id: 'fe5f77bc-097c-48b9-b0ac-68ce2e1e07b8', property_code: 'HOTEL123' } }]);
            const request = context.requests[0];
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.url, ORIGIN + '/integrations/api/v1/event/');
            assert.strictEqual(request.headers['Content-Type'], 'application/json');
            assert.strictEqual(request.maxRedirects, 0);
            assert.match(request.data.tracking_id, UUID4);
            assert.deepStrictEqual({ ...request.data, tracking_id: 'x' }, {
                event: 'inventory.update',
                tracking_id: 'x',
                property_code: 'HOTEL123',
                data: {
                    room_types: [
                        { room_type_code: 'SGL', room_type_name: 'Single Room', default_occupancy: 2, min_occupancy: 2, max_occupancy: 3, number_of_rooms: 11 },
                        { room_type_code: 'DBL', room_type_name: 'Double Room', number_of_rooms: 10 }
                    ],
                    rate_plans: [{ rate_plan_code: 'BAR', rate_plan_name: 'Best Available Rate', room_type_code: 'SGL' }]
                }
            });
            assert.deepStrictEqual(context.sent, [{
                data: { event: 'inventory.update', tracking_id: 'fe5f77bc-097c-48b9-b0ac-68ce2e1e07b8', property_code: 'HOTEL123' },
                port: 'out'
            }]);
        });

        it('Send Inventory leaves rate_plans out when there are none and refuses an incomplete room type', async () => {
            const context = await run(SendInventory, { roomTypes: [{ room_type_code: 'DBL', room_type_name: 'Double Room', number_of_rooms: 10 }] });
            assert.strictEqual('rate_plans' in bodyOf(context).data, false);
            for (const roomTypes of ['', '[]', 'not json', '{"room_type_code":"DBL"}', '[{"room_type_code":"DBL","room_type_name":"Double"}]', '[{"room_type_code":"DBL","room_type_name":"Double","number_of_rooms":1.5}]']) {
                const failing = cachedToken(createContext({ content: { roomTypes } }));
                await assert.rejects(SendInventory.receive(failing), CancelError);
                assert.strictEqual(failing.requests.length, 0);
            }
        });

        it('Send Availability builds one date range from the fields', async () => {
            const context = await run(SendAvailability, {
                roomTypeCode: ' DBL ', roomTypeName: 'Double Room', startDate: '2027-06-25T00:00:00.000Z', endDate: '2027-06-30', roomsLeft: '5', outOfOrder: 0
            });
            assert.deepStrictEqual({ ...bodyOf(context), tracking_id: 'x' }, {
                event: 'availability.update',
                tracking_id: 'x',
                property_code: 'HOTEL123',
                data: [{
                    room_type_code: 'DBL',
                    room_type_name: 'Double Room',
                    calendar: [{ start_date: '2027-06-25', end_date: '2027-06-30', rooms_left: 5, out_of_order: 0 }]
                }]
            });
            // Without an echo in the answer, the output is what was sent.
            assert.deepStrictEqual(context.sent[0].data, { event: 'availability.update', tracking_id: bodyOf(context).tracking_id, property_code: 'HOTEL123' });
        });

        it('Send Availability leaves out_of_order out when it is not given, and sends a batch as it is', async () => {
            const single = await run(SendAvailability, { roomTypeCode: 'DBL', roomTypeName: 'Double Room', startDate: '2027-06-25', endDate: '2027-06-25', roomsLeft: 0 });
            assert.deepStrictEqual(bodyOf(single).data[0].calendar, [{ start_date: '2027-06-25', end_date: '2027-06-25', rooms_left: 0 }]);

            const data = [{ room_type_code: 'SGL', room_type_name: 'Single Room', calendar: [{ start_date: '2027-06-28', end_date: '2027-06-28', rooms_left: 7, out_of_order: 1 }] }];
            const batch = await run(SendAvailability, { data: JSON.stringify(data) });
            assert.deepStrictEqual(bodyOf(batch).data, data);
        });

        it('the calendar events refuse bad input before any request', async () => {
            const base = { roomTypeCode: 'DBL', roomTypeName: 'Double Room', startDate: '2027-06-25', endDate: '2027-06-30', roomsLeft: 5 };
            const cases = [
                { ...base, roomTypeCode: '' },
                { ...base, startDate: '' },
                { ...base, startDate: '25/06/2027' },
                { ...base, startDate: '2027-02-30' },
                { ...base, endDate: '2027-06-24' },
                { ...base, roomsLeft: undefined },
                { ...base, roomsLeft: -1 },
                { ...base, roomsLeft: 2.5 },
                { ...base, data: '[{"room_type_code":"DBL","room_type_name":"Double Room","calendar":[{"start_date":"2027-06-25","end_date":"2027-06-25","rooms_left":1}]}]' },
                { data: '[]' },
                { data: '[{"room_type_code":"DBL"}]' },
                { data: '[{"room_type_code":"DBL","room_type_name":"Double Room","calendar":[{"start_date":"2027-06-25"}]}]' },
                { data: '{"room_type_code":"DBL"}' },
                { data: 'not json' }
            ];
            for (const content of cases) {
                const context = cachedToken(createContext({ content }));
                await assert.rejects(SendAvailability.receive(context), CancelError, JSON.stringify(content));
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('Send Rates sends one price, rounded to a whole number, with the rate plan', async () => {
            const context = await run(SendRates, {
                roomTypeCode: 'DBL', roomTypeName: 'Double Room', ratePlanCode: 'BAR', ratePlanName: 'Best Available Rate',
                startDate: '2027-01-02', endDate: '2027-01-05', price: '99.5'
            });
            assert.deepStrictEqual(bodyOf(context).event, 'rates.update');
            assert.deepStrictEqual(bodyOf(context).data, [{
                room_type_code: 'DBL',
                room_type_name: 'Double Room',
                rate_plan_code: 'BAR',
                rate_plan_name: 'Best Available Rate',
                calendar: [{ start_date: '2027-01-02', end_date: '2027-01-05', price: 100 }]
            }]);
        });

        it('Send Rates sends occupancy prices and the default occupancy, without a rate plan when none is given', async () => {
            const context = await run(SendRates, {
                roomTypeCode: 'DBL', roomTypeName: 'Double Room', startDate: '2027-01-01', endDate: '2027-01-01',
                occupancyPrices: '[{"occupancy":1,"price":100},{"occupancy":"2","price":150.4}]', defaultOccupancy: 2
            });
            assert.deepStrictEqual(bodyOf(context).data, [{
                room_type_code: 'DBL',
                room_type_name: 'Double Room',
                default_occupancy: 2,
                calendar: [{ start_date: '2027-01-01', end_date: '2027-01-01', prices: [{ occupancy: 1, price: 100 }, { occupancy: 2, price: 150 }] }]
            }]);
        });

        it('Send Rates needs exactly one of Price and Occupancy Prices, and both halves of a rate plan', async () => {
            const base = { roomTypeCode: 'DBL', roomTypeName: 'Double Room', startDate: '2027-01-01', endDate: '2027-01-01' };
            for (const content of [
                base,
                { ...base, price: 100, occupancyPrices: '[{"occupancy":1,"price":100}]' },
                { ...base, price: 'abc' },
                { ...base, price: -5 },
                { ...base, price: 100, ratePlanCode: 'BAR' },
                { ...base, occupancyPrices: '[{"occupancy":1.5,"price":100}]' }
            ]) {
                const context = cachedToken(createContext({ content }));
                await assert.rejects(SendRates.receive(context), CancelError, JSON.stringify(content));
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('Send Restrictions sends the minimum stays that are given', async () => {
            const both = await run(SendRestrictions, {
                roomTypeCode: 'DBL', roomTypeName: 'Double Room', ratePlanCode: 'BAR', ratePlanName: 'Best Available Rate',
                startDate: '2027-01-02', endDate: '2027-01-05', minStayThrough: 1, minStayArrival: '2'
            });
            assert.strictEqual(bodyOf(both).event, 'restrictions.update');
            assert.deepStrictEqual(bodyOf(both).data[0].calendar, [{ start_date: '2027-01-02', end_date: '2027-01-05', min_stay_through: 1, min_stay_arrival: 2 }]);

            const arrivalOnly = await run(SendRestrictions, { roomTypeCode: 'SGL', roomTypeName: 'Single Room', startDate: '2027-01-01', endDate: '2027-01-01', minStayArrival: 0 });
            assert.deepStrictEqual(bodyOf(arrivalOnly).data, [{
                room_type_code: 'SGL', room_type_name: 'Single Room', calendar: [{ start_date: '2027-01-01', end_date: '2027-01-01', min_stay_arrival: 0 }]
            }]);

            const none = cachedToken(createContext({ content: { roomTypeCode: 'SGL', roomTypeName: 'Single Room', startDate: '2027-01-01', endDate: '2027-01-01' } }));
            await assert.rejects(SendRestrictions.receive(none), CancelError);
            assert.strictEqual(none.requests.length, 0);
        });

        const reservation = (id = 'RES510') => ({
            reservation_id: id,
            status: 'confirmed',
            arrival_date: '2025-11-06',
            departure_date: '2025-11-08',
            created_at: '2025-10-10T09:00:00Z',
            updated_at: '2025-11-06T12:30:00Z',
            stay_dates: [{
                date: '2025-11-06', room_type_id: 'DBL', room_type_name: 'Double Room', rate_plan_id: 'BAR', rate_plan_name: 'Bar Rate',
                number_of_adults: 1, rate_gross_amount: '95.0', rate_net_amount: '80.75', room_revenue_gross_amount: '190.0',
                room_revenue_net_amount: '161.5', currency_code: 'EUR'
            }]
        });

        it('Send Reservations sends reservation.update with both property codes', async () => {
            const context = await run(SendReservations, { reservations: JSON.stringify([reservation()]) });
            assert.deepStrictEqual({ ...bodyOf(context), tracking_id: 'x' }, {
                event: 'reservation.update',
                tracking_id: 'x',
                property_code: 'HOTEL123',
                partner_property_code: 'HOTEL123',
                data: [reservation()]
            });

            const explicit = await run(SendReservations, { reservations: [reservation()], propertyCode: '986', partnerPropertyCode: 'Hotel123' });
            assert.strictEqual(bodyOf(explicit).property_code, '986');
            assert.strictEqual(bodyOf(explicit).partner_property_code, 'Hotel123');
        });

        it('Send Reservations refuses more than 200 reservations and incomplete ones', async () => {
            const many = Array.from({ length: 201 }, (unused, index) => reservation(`RES${index}`));
            for (const reservations of [many, [], '', [{ ...reservation(), status: '' }], [{ ...reservation(), stay_dates: undefined }]]) {
                const context = cachedToken(createContext({ content: { reservations } }));
                await assert.rejects(SendReservations.receive(context), CancelError);
                assert.strictEqual(context.requests.length, 0);
            }
            const limit = await run(SendReservations, { reservations: many.slice(0, 200) });
            assert.strictEqual(bodyOf(limit).data.length, 200);
        });

        it('a validation error of RoomPriceGenie stops the message with its text', async () => {
            const errors = { event: 'rates.update', tracking_id: 't', property_code: 'HOTEL123', errors: [
                { type: 'missing', loc: 'data[0].calendar[0].prices', msg: 'Field required', input: null },
                { type: 'date_from_datetime_parsing', loc: 'data[0].calendar[0].start_date', msg: 'Input should be a valid date or datetime, input is too short', input: '20-01-01' }
            ] };
            const content = { roomTypeCode: 'DBL', roomTypeName: 'Double Room', startDate: '2027-01-01', endDate: '2027-01-01', price: 100 };
            const expected = /data\[0\]\.calendar\[0\]\.prices: Field required; data\[0\]\.calendar\[0\]\.start_date: Input should be/;

            const asStatus = cachedToken(createContext({ content, responses: [httpError(422, errors)] }));
            await assert.rejects(SendRates.receive(asStatus), (err) => err instanceof CancelError && expected.test(err.message) && /HTTP 422/.test(err.message));

            // The same answer with status 200 is a failure too.
            const asOk = cachedToken(createContext({ content, responses: [{ data: errors }] }));
            await assert.rejects(SendRates.receive(asOk), (err) => err instanceof CancelError && expected.test(err.message));
            assert.strictEqual(asOk.sent.length, 0);
        });

        it('an outage is an error the engine retries, and no credential is in its message', async () => {
            const content = { roomTypeCode: 'DBL', roomTypeName: 'Double Room', startDate: '2027-01-01', endDate: '2027-01-01', price: 100 };
            for (const failure of [httpError(500, 'Internal Server Error'), httpError(429, {}), new Error('timeout of 30000ms exceeded')]) {
                const context = cachedToken(createContext({ content, responses: [failure] }));
                await assert.rejects(SendRates.receive(context), (err) => {
                    return !(err instanceof CancelError) && !err.message.includes(PARTNER_API_KEY) && !err.message.includes('access-1') && err.config === undefined;
                });
            }
        });
    });

    describe('Create Account', () => {

        const input = {
            propertyCode: 'e2be44ad', hotelName: 'Genie Palace Hotel', hotelAddress: '123, Genie Road, Sunset Boulevard', hotelPostcode: 'GN-1333',
            latitude: -60.0905, longitude: '-157.6386', hotelTimezone: 'Europe/London', hotelCountryCode: 'gb', hotelCurrencyCode: 'gbp',
            ownerLanguage: 'en-GB', ownerEmail: 'owner@geniepalace.com', ownerFirstName: 'Genie', ownerLastName: 'Johnson'
        };
        const answer = {
            event: 'account.create',
            tracking_id: 'cb40a21a-93a3-4153-8473-6779e7d0949d',
            property_code: 'e2be44ad',
            data: { message: 'Account creation request received successfully!', credentials: { client_id: 'new-client-id', client_secret: 'new-client-secret' } }
        };

        it('sends the documented account.create with the Partner API Key only, and no account', async () => {
            const context = createContext({ auth: {}, content: input, responses: [{ data: answer }] });
            await CreateAccount.receive(context);
            assert.strictEqual(context.requests.length, 1);
            const request = context.requests[0];
            assert.strictEqual(request.url, ORIGIN + '/integrations/api/v1/connect/accounts/');
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.headers['X-API-Key'], PARTNER_API_KEY);
            assert.strictEqual('Authorization' in request.headers, false);
            assert.match(request.data.tracking_id, UUID4);
            assert.deepStrictEqual({ ...request.data, tracking_id: 'x' }, {
                event: 'account.create',
                tracking_id: 'x',
                property_code: 'e2be44ad',
                data: {
                    hotel_name: 'Genie Palace Hotel',
                    hotel_country_code: 'GB',
                    owner_email: 'owner@geniepalace.com',
                    owner_first_name: 'Genie',
                    hotel_address: '123, Genie Road, Sunset Boulevard',
                    hotel_postcode: 'GN-1333',
                    hotel_timezone: 'Europe/London',
                    owner_language: 'en-GB',
                    owner_last_name: 'Johnson',
                    hotel_currency_code: 'GBP',
                    hotel_coordinates: [-60.0905, -157.6386]
                }
            });
            assert.deepStrictEqual(context.sent[0].data, {
                event: 'account.create',
                tracking_id: 'cb40a21a-93a3-4153-8473-6779e7d0949d',
                property_code: 'e2be44ad',
                message: 'Account creation request received successfully!',
                client_id: 'new-client-id',
                client_secret: 'new-client-secret'
            });
        });

        it('sends only the required fields when the rest is empty', async () => {
            const context = createContext({
                auth: {},
                content: { propertyCode: 'P1', hotelName: 'H', hotelCountryCode: 'CH', ownerEmail: 'o@example.com', ownerFirstName: 'O' },
                responses: [{ data: answer }]
            });
            await CreateAccount.receive(context);
            assert.deepStrictEqual(context.requests[0].data.data, { hotel_name: 'H', hotel_country_code: 'CH', owner_email: 'o@example.com', owner_first_name: 'O' });
        });

        it('refuses incomplete or malformed input before any request', async () => {
            for (const change of [{ propertyCode: '' }, { hotelName: '' }, { ownerEmail: '' }, { ownerFirstName: ' ' }, { hotelCountryCode: 'GBR' },
                { hotelCurrencyCode: 'pound' }, { longitude: '' }, { latitude: 91 }]) {
                const context = createContext({ auth: {}, content: { ...input, ...change } });
                await assert.rejects(CreateAccount.receive(context), CancelError, JSON.stringify(change));
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('a rejected request (a pending one exists) stops the message; an answer without credentials is an error', async () => {
            const pending = createContext({ auth: {}, content: input, responses: [httpError(400, { errors: [{ type: 'value_error', loc: 'property_code', msg: 'A request is already pending.' }] })] });
            await assert.rejects(CreateAccount.receive(pending), (err) => err instanceof CancelError && /already pending/.test(err.message));

            const empty = createContext({ auth: {}, content: input, responses: [{ data: { event: 'account.create', data: { message: 'ok' } } }] });
            await assert.rejects(CreateAccount.receive(empty), /no credentials/);
            assert.strictEqual(empty.sent.length, 0);
        });
    });

    describe('Make API Call', () => {

        const withToken = (context) => {
            context.cache[lib.tokenCacheKey(context)] = { accessToken: 'access-1', expiresAt: Date.now() + 3600 * 1000, refreshToken: '', refreshExpiresAt: 0 };
            return context;
        };

        it('sends the request to the configured host with both credentials', async () => {
            const context = withToken(createContext({
                content: {
                    url: '/integrations/v1/connect/iframe/',
                    method: 'POST',
                    headers: JSON.stringify({ 'X-Custom': 'yes', authorization: 'Bearer stolen', 'x-api-key': 'other' }),
                    parameters: JSON.stringify({ a: '1' }),
                    body: '{"scope":"roompricegenie-ui"}'
                },
                responses: [{ status: 200, headers: { 'content-type': 'application/json' }, data: { url: 'https://iframe.roompricegenie.com/' } }]
            }));
            await MakeApiCall.receive(context);
            const request = context.requests[0];
            assert.strictEqual(request.url, ORIGIN + '/integrations/v1/connect/iframe/');
            assert.strictEqual(request.method, 'POST');
            assert.deepStrictEqual(request.headers, {
                Accept: 'application/json', 'X-Custom': 'yes', 'Content-Type': 'application/json', 'X-API-Key': PARTNER_API_KEY, Authorization: 'Bearer access-1'
            });
            assert.deepStrictEqual(request.params, { a: '1' });
            assert.deepStrictEqual(request.data, { scope: 'roompricegenie-ui' });
            assert.strictEqual(request.maxRedirects, 0);
            assert.deepStrictEqual(context.sent[0].data, {
                statusCode: 200, headers: { 'content-type': 'application/json' }, body: { url: 'https://iframe.roompricegenie.com/' }
            });
        });

        it('accepts a full URL on the configured host and a path without a leading slash', () => {
            const context = createContext();
            assert.strictEqual(lib.resolveApiUrl(context, ORIGIN + '/integrations/jwk/'), ORIGIN + '/integrations/jwk/');
            assert.strictEqual(lib.resolveApiUrl(context, 'integrations/jwk/'), ORIGIN + '/integrations/jwk/');
        });

        it('refuses every other host before any request, also for the token', async () => {
            const targets = [
                'https://evil.example/integrations/api/v1/event/',
                '//evil.example/x',
                '\\\\evil.example\\x',
                'https://refactoringdevapi.roompricegenie.com@evil.example/x',
                'https://user:pass@refactoringdevapi.roompricegenie.com/x',
                'http://refactoringdevapi.roompricegenie.com/x',
                'https://api.roompricegenie.com/x',
                'https://refactoringdevapi.roompricegenie.com:8443/x',
                'https://refactoringdevapi.roompricegenie.com.evil.example/x'
            ];
            for (const url of targets) {
                const context = createContext({ content: { url, method: 'GET' } });
                await assert.rejects(MakeApiCall.receive(context), CancelError, url);
                assert.strictEqual(context.requests.length, 0, url);
            }
        });

        it('requires a path and a method', async () => {
            await assert.rejects(MakeApiCall.receive(createContext({ content: { method: 'GET' } })), CancelError);
            await assert.rejects(MakeApiCall.receive(createContext({ content: { url: '/x' } })), CancelError);
        });
    });

    describe('token verification (jwt.js)', () => {

        const getKey = async (kid) => (kid === 'kid-1' ? rpg.publicKey : undefined);
        const verify = (token, options = {}) => jwt.verify(token, { getKey, issuer: 'RoomPriceGenie', ...options });
        const rejectsWith = (promise, code) => assert.rejects(promise, (err) => err instanceof jwt.JwtError && err.code === code);

        it('accepts a token RoomPriceGenie signed', async () => {
            const payload = await verify(validToken());
            assert.strictEqual(payload.client_id, 'client-hotel123');
            assert.deepStrictEqual(jwt.audiences(payload), ['HOTEL123']);
        });

        it('rejects a token signed with another key under the same key id', async () => {
            await rejectsWith(verify(signRs256(attacker.privateKey, claims(), { kid: 'kid-1' })), 'signature');
        });

        it('rejects a token whose payload was changed after signing', async () => {
            const [head, , signature] = validToken().split('.');
            await rejectsWith(verify(`${head}.${b64url(claims({ aud: ['OTHER'] }))}.${signature}`), 'signature');
        });

        it('rejects an unsigned token ("alg": "none"), with and without a signature part', async () => {
            const unsigned = `${b64url({ alg: 'none', typ: 'JWT', kid: 'kid-1' })}.${b64url(claims())}`;
            await rejectsWith(verify(unsigned + '.'), 'malformed');
            await rejectsWith(verify(unsigned), 'malformed');
            await rejectsWith(verify(unsigned + '.' + validToken().split('.')[2]), 'algorithm');
            for (const alg of ['None', 'NONE', 'nOnE']) {
                await rejectsWith(verify(`${b64url({ alg, kid: 'kid-1' })}.${b64url(claims())}.c2ln`), 'algorithm');
            }
        });

        it('rejects HS256 signed with the public key as the secret', async () => {
            const signingInput = `${b64url({ alg: 'HS256', typ: 'JWT', kid: 'kid-1' })}.${b64url(claims())}`;
            for (const secret of [
                rpg.publicKey.export({ type: 'spki', format: 'pem' }),
                rpg.publicKey.export({ type: 'pkcs1', format: 'pem' }),
                rpg.publicKey.export({ type: 'spki', format: 'der' })
            ]) {
                const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');
                await rejectsWith(verify(`${signingInput}.${signature}`), 'algorithm');
            }
        });

        it('rejects every other algorithm, also with a valid RSA signature of that kind', async () => {
            for (const [alg, digest] of [['RS384', 'RSA-SHA384'], ['RS512', 'RSA-SHA512'], ['PS256', 'RSA-SHA256'], ['ES256', 'RSA-SHA256']]) {
                const signingInput = `${b64url({ alg, typ: 'JWT', kid: 'kid-1' })}.${b64url(claims())}`;
                const signature = crypto.sign(digest, Buffer.from(signingInput), rpg.privateKey).toString('base64url');
                await rejectsWith(verify(`${signingInput}.${signature}`), 'algorithm');
            }
            await rejectsWith(verify(signRs256(rpg.privateKey, claims(), { kid: 'kid-1', alg: ['RS256'] })), 'algorithm');
        });

        it('never uses a key or key URL from the token itself', async () => {
            const header = {
                kid: 'kid-attacker',
                jwk: attacker.publicKey.export({ format: 'jwk' }),
                jku: 'https://evil.example/jwks.json',
                x5u: 'https://evil.example/cert.pem'
            };
            const asked = [];
            const token = signRs256(attacker.privateKey, claims(), header);
            await rejectsWith(jwt.verify(token, { issuer: 'RoomPriceGenie', getKey: async (kid) => { asked.push(kid); return undefined; } }), 'unknown_key');
            assert.deepStrictEqual(asked, ['kid-attacker']);
            // With the key id of the real key, the embedded key still does not count.
            await rejectsWith(verify(signRs256(attacker.privateKey, claims(), { ...header, kid: 'kid-1' })), 'signature');
        });

        it('rejects a token without a key id, with a critical header, or one that is not a JWT', async () => {
            await rejectsWith(verify(signRs256(rpg.privateKey, claims())), 'kid');
            await rejectsWith(verify(signRs256(rpg.privateKey, claims(), { kid: 'kid-1', crit: ['exp'] })), 'algorithm');
            for (const token of ['', undefined, 'abc', 'a.b', 'a.b.c.d', 'e30.e30.', '!!.e30.c2ln', `${b64url('[]')}.${b64url({})}.c2ln`, 'x'.repeat(9000)]) {
                await rejectsWith(verify(token), 'malformed');
            }
        });

        it('rejects an expired token, one without an expiry, and one from the future', async () => {
            await rejectsWith(verify(validToken({ exp: nowSeconds() - 61 })), 'expired');
            await rejectsWith(verify(validToken({ exp: undefined })), 'expired');
            await rejectsWith(verify(validToken({ exp: String(nowSeconds() + 1000) })), 'expired');
            await rejectsWith(verify(validToken({ iat: nowSeconds() + 3600 })), 'not_yet_valid');
            await rejectsWith(verify(validToken({ nbf: nowSeconds() + 3600 })), 'not_yet_valid');
            // A clock that is a few seconds off is tolerated.
            await verify(validToken({ exp: nowSeconds() - 5 }));
            await verify(validToken({ iat: nowSeconds() + 5 }));
        });

        it('rejects another issuer', async () => {
            await rejectsWith(verify(validToken({ iss: 'roompricegenie' })), 'issuer');
            await rejectsWith(verify(validToken({ iss: undefined })), 'issuer');
        });

        it('does not verify with a private or a non-RSA key', async () => {
            const ec = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
            await rejectsWith(verify(validToken(), { getKey: async () => ec.publicKey }), 'unknown_key');
            await rejectsWith(verify(validToken(), { getKey: async () => rpg.privateKey }), 'unknown_key');
        });

        it('reads the key set RoomPriceGenie documents and skips keys that must not be used', () => {
            const body = {
                key: [
                    toJwk(rpg.publicKey, 'good'),
                    toJwk(rpgNext.publicKey, 'expired'),
                    toJwk(weak.publicKey, 'weak'),
                    { ...toJwk(rpg.publicKey, 'not-for-verifying'), key_ops: ['encrypt'] },
                    { ...toJwk(rpg.publicKey, 'other-alg'), alg: 'RS512' },
                    { ...toJwk(rpg.publicKey, 'encryption'), use: 'enc' },
                    { kty: 'oct', k: 'c2VjcmV0', kid: 'symmetric' },
                    { ...crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }).publicKey.export({ format: 'jwk' }), kid: 'ec' },
                    { ...toJwk(rpg.publicKey, ''), kid: '' },
                    'not a key'
                ],
                info: [{ kid: 'good', expiry_date: '2099-01-01T00:00:00Z' }, { kid: 'expired', expiry_date: '2020-01-01T00:00:00Z' }]
            };
            assert.deepStrictEqual([...jwt.keysFromJwks(body).keys()], ['good']);
            assert.deepStrictEqual([...jwt.keysFromJwks({ keys: [toJwk(rpg.publicKey, 'standard')] }).keys()], ['standard']);
            assert.strictEqual(jwt.keysFromJwks(null).size, 0);
            assert.strictEqual(jwt.keysFromJwks({ key: 'x' }).size, 0);
        });

        it('a private key in the key set is reduced to its public half', () => {
            const keys = jwt.keysFromJwks({ key: [{ ...rpg.privateKey.export({ format: 'jwk' }), kid: 'leaked' }] });
            assert.strictEqual(keys.get('leaked').type, 'public');
        });
    });

    describe('signing key cache', () => {

        const store = (options) => {
            const state = { fetches: 0, time: 1000000, body: { key: [toJwk(rpg.publicKey, 'kid-1')] }, failure: null };
            const keyStore = jwt.createKeyStore({
                fetch: async () => {
                    state.fetches++;
                    if (state.failure) {
                        throw state.failure;
                    }
                    return state.body;
                },
                now: () => state.time,
                ...options
            });
            return { state, keyStore };
        };

        it('fetches the keys once and serves them from the cache', async () => {
            const { state, keyStore } = store();
            assert(await keyStore.getKey('kid-1'));
            assert(await keyStore.getKey('kid-1'));
            assert.strictEqual(state.fetches, 1);
        });

        it('concurrent callers share one request', async () => {
            const { state, keyStore } = store();
            await Promise.all([keyStore.getKey('kid-1'), keyStore.getKey('kid-1'), keyStore.getKey('kid-2')]);
            assert.strictEqual(state.fetches, 1);
        });

        it('fetches again after the time to live', async () => {
            const { state, keyStore } = store();
            await keyStore.getKey('kid-1');
            state.time += 60 * 60 * 1000 + 1;
            await keyStore.getKey('kid-1');
            assert.strictEqual(state.fetches, 2);
        });

        it('an unknown key id triggers one fetch, then none for a minute', async () => {
            const { state, keyStore } = store();
            await keyStore.getKey('kid-1');
            state.time += 61 * 1000;
            assert.strictEqual(await keyStore.getKey('made-up-1'), undefined);
            assert.strictEqual(await keyStore.getKey('made-up-2'), undefined);
            assert.strictEqual(await keyStore.getKey('made-up-3'), undefined);
            assert.strictEqual(state.fetches, 2);
            state.time += 61 * 1000;
            await keyStore.getKey('made-up-4');
            assert.strictEqual(state.fetches, 3);
        });

        it('finds a key RoomPriceGenie rotated in', async () => {
            const { state, keyStore } = store();
            await keyStore.getKey('kid-1');
            state.body = { key: [toJwk(rpg.publicKey, 'kid-1'), toJwk(rpgNext.publicKey, 'kid-2')] };
            state.time += 61 * 1000;
            assert(await keyStore.getKey('kid-2'));
        });

        it('keeps the known keys when a refresh fails, and forgets a key that was removed', async () => {
            const { state, keyStore } = store();
            await keyStore.getKey('kid-1');
            state.failure = new Error('ECONNRESET');
            state.time += 2 * 60 * 60 * 1000;
            assert(await keyStore.getKey('kid-1'));
            state.failure = null;
            state.body = { key: [toJwk(rpgNext.publicKey, 'kid-2')] };
            state.time += 61 * 1000;
            assert.strictEqual(await keyStore.getKey('kid-1'), undefined);
        });

        it('fails when no key set was ever fetched, and an empty key set is not taken over', async () => {
            const { state, keyStore } = store();
            state.failure = new Error('ECONNREFUSED');
            await assert.rejects(keyStore.getKey('kid-1'), /ECONNREFUSED/);
            await assert.rejects(keyStore.getKey('kid-1'), /not available/);
            state.failure = null;
            state.body = { key: [] };
            state.time += 61 * 1000;
            await assert.rejects(keyStore.getKey('kid-1'), /no usable signing key/);
        });
    });

    describe('endpoint for RoomPriceGenie (routes.js)', () => {

        const listeners = () => [
            listener('rates.update', 'HOTEL123', 'client-hotel123'),
            listener('restrictions.update', 'HOTEL123', 'client-hotel123'),
            listener('rates.update', 'HOTEL999', 'client-hotel999')
        ];
        const plugin = (options = {}) => createPluginContext({ listeners: listeners(), jwks: jwks(), ...options });

        it('registers POST /events without Appmixer authentication, for JSON only', () => {
            const context = plugin();
            routes(context);
            assert.strictEqual(context.registered.length, 1);
            const route = context.registered[0];
            assert.strictEqual(route.method, 'POST');
            assert.strictEqual(route.path, '/events');
            assert.strictEqual(route.options.auth, false);
            assert.deepStrictEqual(route.options.payload.allow, ['application/json']);
        });

        it('the registered handler answers with the status and JSON body of handleEvent', async () => {
            const context = plugin();
            routes(context);
            const response = {};
            const h = {
                response(body) {
                    response.body = body;
                    return { type(type) { response.type = type; return { code(code) { response.code = code; return response; } }; } };
                }
            };
            const { handler } = context.registered[0].options;
            await handler({ headers: { 'x-api-key': PARTNER_API_KEY, authorization: `Bearer ${validToken()}` }, payload: ratesPush() }, h);
            assert.deepStrictEqual(response, {
                body: { event: 'rates.update', tracking_id: 'eec4776f-3b5c-484a-aa02-f8c525d5b706', property_code: 'HOTEL123' },
                type: 'application/json',
                code: 200
            });
            await handler({ headers: {}, payload: ratesPush() }, h);
            assert.strictEqual(response.code, 401);
        });

        it('a valid rates push is answered 200 with the documented echo and reaches the property\'s flow', async () => {
            const context = plugin();
            const result = await push(context, ratesPush(), validToken());
            assert.deepStrictEqual(result, {
                statusCode: 200,
                body: { event: 'rates.update', tracking_id: 'eec4776f-3b5c-484a-aa02-f8c525d5b706', property_code: 'HOTEL123' }
            });
            // One message per room type and rate plan.
            assert.strictEqual(context.delivered.length, 2);
            for (const delivery of context.delivered) {
                assert.strictEqual(delivery.eventName, 'rates.update');
                assert.deepStrictEqual(delivery.urls, ['https://appmixer.example/flows/f/components/client-hotel123']);
            }
            const { deliveryProof, ...first } = context.delivered[0].payload;
            assert.deepStrictEqual(first, {
                room_type_code: 'DBL',
                room_type_name: 'Double Room',
                rate_plan_code: 'BAR',
                rate_plan_name: 'Best Available Rate',
                calendar: [
                    { start_date: '2024-01-01', end_date: '2024-01-01', price: 100 },
                    { start_date: '2024-01-02', end_date: '2024-01-07', prices: [{ occupancy: 1, price: 120 }, { occupancy: 2, price: 150 }] }
                ],
                event: 'rates.update',
                tracking_id: 'eec4776f-3b5c-484a-aa02-f8c525d5b706',
                property_code: 'HOTEL123',
                index: 0,
                count: 2
            });
            assert.match(deliveryProof, /^[0-9a-f]{64}$/);
            assert.strictEqual(context.delivered[1].payload.rate_plan_code, 'NONREF');
            assert.strictEqual(context.delivered[1].payload.index, 1);
        });

        it('the signing keys are read from the configured host with the Partner API Key, once', async () => {
            const context = plugin();
            await push(context, ratesPush(), validToken());
            await push(context, restrictionsPush(), validToken());
            assert.strictEqual(context.requests.length, 1);
            assert.deepStrictEqual(context.requests[0], {
                method: 'GET',
                url: ORIGIN + '/integrations/jwk/',
                headers: { Accept: 'application/json', 'X-API-Key': PARTNER_API_KEY },
                maxRedirects: 0,
                timeout: 10000
            });
        });

        it('a valid restrictions push is answered 200 with the documented echo and delivered', async () => {
            const context = plugin();
            const result = await push(context, restrictionsPush(), validToken());
            assert.deepStrictEqual(result, {
                statusCode: 200,
                body: { event: 'restrictions.update', tracking_id: 'd3095e42-8d6e-4bb4-b452-7f06f2154589', property_code: 'HOTEL123' }
            });
            assert.strictEqual(context.delivered.length, 1);
            assert.strictEqual(context.delivered[0].eventName, 'restrictions.update');
            assert.deepStrictEqual(context.delivered[0].payload.calendar, [{ start_date: '2024-01-02', end_date: '2024-01-07', min_stay_arrival: 2 }]);
        });

        it('a key rotation notice (empty audience) is answered 200 {} and the keys are read again', async () => {
            const context = plugin();
            await push(context, ratesPush(), validToken());
            assert.strictEqual(context.requests.length, 1);

            // RoomPriceGenie adds a key and announces it.
            context.jwks = { key: [toJwk(rpg.publicKey, 'kid-1'), toJwk(rpgNext.publicKey, 'kid-2')] };
            const notice = {
                event: 'public_key',
                tracking_id: '2f7a6d3e-9b4b-4d1e-9f8a-1c2d3e4f5a6b',
                data: [{ type: 'added', key: { kid: 'kid-2', kty: 'RSA', alg: 'RS256', e: 'AQAB', n: 'ignored' } }]
            };
            const result = await push(context, notice, validToken({ aud: [], property_code: [], client_id: 'partner-423' }));
            assert.deepStrictEqual(result, { statusCode: 200, body: {} });
            assert.strictEqual(context.requests.length, 2);
            assert.strictEqual(context.delivered.length, 2);

            // A push signed with the new key is accepted without another fetch.
            const next = await push(context, restrictionsPush(), signRs256(rpgNext.privateKey, claims(), { kid: 'kid-2' }));
            assert.strictEqual(next.statusCode, 200);
            assert.strictEqual(context.requests.length, 2);
        });

        it('a key in a rotation notice is never trusted by itself', async () => {
            const context = plugin();
            const notice = {
                event: 'public_key',
                tracking_id: 't-1',
                data: [{ type: 'added', key: { ...toJwk(attacker.publicKey, 'kid-evil'), alg: 'RS256' } }]
            };
            assertRejected(await push(context, notice, signRs256(attacker.privateKey, claims({ aud: [] }), { kid: 'kid-evil' })));
            assert.strictEqual((await push(context, notice, validToken({ aud: [] }))).statusCode, 200);
            assertRejected(await push(context, ratesPush(), signRs256(attacker.privateKey, claims(), { kid: 'kid-evil' })));
            assert.strictEqual(context.delivered.length, 0);
        });

        it('a bad signature is answered 401 and nothing is delivered', async () => {
            const context = plugin();
            const result = await push(context, ratesPush(), signRs256(attacker.privateKey, claims(), { kid: 'kid-1' }));
            assert.deepStrictEqual(result, {
                statusCode: 401,
                body: {
                    event: 'rates.update',
                    tracking_id: 'eec4776f-3b5c-484a-aa02-f8c525d5b706',
                    property_code: 'HOTEL123',
                    errors: [{ type: 'unauthorized', msg: 'Invalid or missing credentials.', input: null }]
                }
            });
            assert.strictEqual(context.delivered.length, 0);
            assert.deepStrictEqual(context.logs, [{ level: 'warn', message: 'roompricegenie-event-rejected', data: { reason: 'signature' } }]);
        });

        it('wrong algorithms are answered 401: none, and HS256 with the public key', async () => {
            const context = plugin();
            const none = `${b64url({ alg: 'none', typ: 'JWT', kid: 'kid-1' })}.${b64url(claims())}`;
            assertRejected(await push(context, ratesPush(), none + '.'));
            assertRejected(await push(context, ratesPush(), none + '.c2ln'));
            const signingInput = `${b64url({ alg: 'HS256', typ: 'JWT', kid: 'kid-1' })}.${b64url(claims())}`;
            const pem = rpg.publicKey.export({ type: 'spki', format: 'pem' });
            assertRejected(await push(context, ratesPush(), `${signingInput}.${crypto.createHmac('sha256', pem).update(signingInput).digest('base64url')}`));
            assert.strictEqual(context.delivered.length, 0);
            assert.deepStrictEqual(context.logs.map(entry => entry.data.reason), ['malformed', 'algorithm', 'algorithm']);
        });

        it('an expired token is answered 401', async () => {
            const context = plugin();
            assertRejected(await push(context, ratesPush(), validToken({ exp: nowSeconds() - 3600, iat: nowSeconds() - 90000 })));
            assert.strictEqual(context.delivered.length, 0);
            assert.strictEqual(context.logs[0].data.reason, 'expired');
        });

        it('a token of another issuer is answered 401', async () => {
            const context = plugin();
            assertRejected(await push(context, ratesPush(), validToken({ iss: 'SomebodyElse' })));
            assert.strictEqual(context.delivered.length, 0);
        });

        it('a missing or malformed Authorization header is answered 401', async () => {
            const context = plugin();
            assertRejected(await push(context, ratesPush(), undefined));
            assertRejected(await push(context, ratesPush(), undefined, { authorization: `Basic ${validToken()}` }));
            assertRejected(await push(context, ratesPush(), undefined, { authorization: validToken() }));
            assertRejected(await push(context, ratesPush(), undefined, { authorization: ['Bearer a', 'Bearer b'] }));
            assert.strictEqual(context.delivered.length, 0);
        });

        it('without the Partner API Key nothing happens: 401, and no key is fetched from RoomPriceGenie', async () => {
            const context = plugin();
            for (const headers of [{ 'x-api-key': undefined }, { 'x-api-key': 'wrong' }, { 'x-api-key': '' }, { 'x-api-key': PARTNER_API_KEY + ' ' }]) {
                assertRejected(await push(context, ratesPush(), validToken(), headers));
            }
            assert.strictEqual(context.requests.length, 0);
            assert.strictEqual(context.delivered.length, 0);
            assert.strictEqual(context.logs[0].data.reason, 'api_key');
        });

        it('a token for another property cannot carry an update for this one', async () => {
            const context = plugin();
            // Signed by RoomPriceGenie, but for HOTEL999: the body names HOTEL123.
            assertRejected(await push(context, ratesPush(), validToken({ aud: ['HOTEL999'], property_code: ['HOTEL999'], client_id: 'client-hotel999' })));
            // The "property_code" claim is a copy and does not replace "aud".
            assertRejected(await push(context, ratesPush(), validToken({ aud: [], property_code: ['HOTEL123'] })));
            assertRejected(await push(context, ratesPush(), validToken({ aud: undefined })));
            assert.strictEqual(context.delivered.length, 0);
            assert.strictEqual(context.logs[0].data.reason, 'audience');
        });

        it('an unknown property is answered 404 and nothing is delivered', async () => {
            const context = plugin();
            const body = { ...ratesPush(), property_code: 'HOTEL404' };
            const result = await push(context, body, validToken({ aud: ['HOTEL404'], client_id: 'client-hotel404' }));
            assert.deepStrictEqual(result, {
                statusCode: 404,
                body: {
                    event: 'rates.update',
                    tracking_id: 'eec4776f-3b5c-484a-aa02-f8c525d5b706',
                    property_code: 'HOTEL404',
                    errors: [{ type: 'property_not_found', loc: 'property_code', msg: 'No running integration receives this event for the property.', input: null }]
                }
            });
            assert.strictEqual(context.delivered.length, 0);
        });

        it('a property with a flow for another event only is answered 404 for this event', async () => {
            const context = plugin({ listeners: [listener('rates.update', 'HOTEL123', 'client-hotel123')] });
            assert.strictEqual((await push(context, restrictionsPush(), validToken())).statusCode, 404);
            assert.strictEqual(context.delivered.length, 0);
        });

        it('a connection that only names the property code, with another client id, receives nothing', async () => {
            // Somebody connected their own credentials and typed HOTEL123 as the property code.
            const squatter = listener('rates.update', 'HOTEL123', 'client-of-somebody-else', 'https://appmixer.example/flows/x/components/squatter');
            const alone = plugin({ listeners: [squatter] });
            assert.strictEqual((await push(alone, ratesPush(), validToken())).statusCode, 404);
            assert.strictEqual(alone.delivered.length, 0);

            const both = plugin({ listeners: [squatter, ...listeners()] });
            assert.strictEqual((await push(both, ratesPush(), validToken())).statusCode, 200);
            for (const delivery of both.delivered) {
                assert.deepStrictEqual(delivery.urls, ['https://appmixer.example/flows/f/components/client-hotel123']);
            }
        });

        it('a token without a client id is delivered to nobody', async () => {
            const context = plugin();
            assert.strictEqual((await push(context, ratesPush(), validToken({ client_id: undefined }))).statusCode, 404);
            assert.strictEqual(context.delivered.length, 0);
        });

        it('several flows of the same account all receive the update', async () => {
            const second = listener('rates.update', 'HOTEL123', 'client-hotel123', 'https://appmixer.example/flows/g/components/second');
            const context = plugin({ listeners: [...listeners(), second] });
            await push(context, ratesPush(), validToken());
            assert.deepStrictEqual(context.delivered[0].urls, ['https://appmixer.example/flows/f/components/client-hotel123', 'https://appmixer.example/flows/g/components/second']);
        });

        it('with a configured partner ID, a token of another partner is answered 401', async () => {
            const context = plugin({ config: { ...CONFIG, partnerId: '423' } });
            assert.strictEqual((await push(context, ratesPush(), validToken())).statusCode, 200);
            assertRejected(await push(context, ratesPush(), validToken({ sub: '999' })));
            assert.strictEqual(context.logs[0].data.reason, 'partner');
        });

        it('an unknown key id costs one fetch, then no more', async () => {
            const context = plugin();
            for (let i = 0; i < 5; i++) {
                assertRejected(await push(context, ratesPush(), signRs256(attacker.privateKey, claims(), { kid: `made-up-${i}` })));
            }
            assert.strictEqual(context.requests.length, 1);
        });

        it('a 1024 bit key in the key set is not used', async () => {
            const context = plugin({ jwks: { key: [toJwk(weak.publicKey, 'kid-weak'), toJwk(rpg.publicKey, 'kid-1')] } });
            assertRejected(await push(context, ratesPush(), signRs256(weak.privateKey, claims(), { kid: 'kid-weak' })));
            assert.strictEqual(context.delivered.length, 0);
        });

        it('when the signing keys cannot be read, the answer is 503, not 200 and not 401', async () => {
            const context = plugin();
            context.jwksFailure = httpError(500, {});
            const result = await push(context, ratesPush(), validToken());
            assert.strictEqual(result.statusCode, 503);
            assert.strictEqual(result.body.errors[0].type, 'unavailable');
            assert.strictEqual(context.delivered.length, 0);
        });

        it('without configuration the answer is 503 and no request is made', async () => {
            for (const config of [{}, { baseUrl: ORIGIN }, { partnerApiKey: PARTNER_API_KEY }, null]) {
                const context = plugin({ config });
                const result = await push(context, ratesPush(), validToken());
                assert.strictEqual(result.statusCode, 503);
                assert.strictEqual(result.body.errors[0].type, 'not_configured');
                assert.strictEqual(context.requests.length, 0);
                assert.strictEqual(context.delivered.length, 0);
            }
        });

        it('a configured base URL outside roompricegenie.com is never asked for keys', async () => {
            for (const baseUrl of ['https://evil.example', 'https://refactoringdevapi.roompricegenie.com.evil.example', 'http://refactoringdevapi.roompricegenie.com']) {
                const context = plugin({ config: { baseUrl, partnerApiKey: PARTNER_API_KEY } });
                const result = await push(context, ratesPush(), signRs256(attacker.privateKey, claims(), { kid: 'kid-1' }));
                assert.strictEqual(result.statusCode, 503);
                assert.strictEqual(context.requests.length, 0);
                assert.strictEqual(context.delivered.length, 0);
            }
        });

        it('an unsupported event and a malformed body are answered 400, after authentication', async () => {
            const context = plugin();
            const cases = [
                [{ ...ratesPush(), event: 'reservation.update' }, 'unsupported_event'],
                [{ ...ratesPush(), event: undefined }, 'missing'],
                [{ ...ratesPush(), tracking_id: 123 }, 'missing'],
                [{ ...ratesPush(), property_code: undefined }, 'missing'],
                [{ ...ratesPush(), data: 'x' }, 'list_type'],
                [{ ...ratesPush(), data: [1] }, 'list_type'],
                ['not an object', 'missing'],
                [null, 'missing']
            ];
            for (const [payload, type] of cases) {
                const result = await push(context, payload, validToken());
                assert.strictEqual(result.statusCode, 400, JSON.stringify(payload));
                assert.strictEqual(result.body.errors[0].type, type);
            }
            assert.strictEqual(context.delivered.length, 0);
            // Without valid credentials the same bodies are 401: the body is not looked at first.
            assertRejected(await push(context, { event: 'reservation.update', tracking_id: 't' }, 'abc'));
        });

        it('an update without items is acknowledged and delivers nothing', async () => {
            const context = plugin();
            const result = await push(context, { ...ratesPush(), data: [] }, validToken());
            assert.strictEqual(result.statusCode, 200);
            assert.strictEqual(context.delivered.length, 0);
        });

        it('refuses a listener without a property code or a client id', async () => {
            const context = plugin();
            routes(context);
            const [callback] = context.listenerCallbacks;
            await callback({ eventName: 'rates.update', params: { propertyCode: 'HOTEL123', clientId: 'client-hotel123' } });
            for (const params of [{}, { propertyCode: 'HOTEL123' }, { clientId: 'c' }, { propertyCode: '', clientId: 'c' }, { propertyCode: ['HOTEL123'], clientId: 'c' }, undefined]) {
                await assert.rejects(callback({ eventName: 'rates.update', params }), /property code and a client id/);
            }
        });
    });

    describe('triggers', () => {

        // What the route hands over for the first item of a valid rates push.
        const delivered = async (payload = ratesPush(), token = validToken()) => {
            const context = createPluginContext({ listeners: [listener(payload.event, 'HOTEL123', 'client-hotel123')], jwks: jwks() });
            const result = await push(context, payload, token);
            assert.strictEqual(result.statusCode, 200);
            // The engine stores the event and hands it to the trigger as JSON.
            return JSON.parse(JSON.stringify(context.delivered[0].payload));
        };

        it('start registers the property code and client id of the account; stop removes the listener', async () => {
            for (const [trigger, eventName] of [[NewRateUpdate, 'rates.update'], [NewRestrictionUpdate, 'restrictions.update']]) {
                const context = createContext();
                await trigger.start(context);
                assert.deepStrictEqual(context.listeners, [{ eventName, params: { propertyCode: 'HOTEL123', clientId: 'client-hotel123' } }]);
                await trigger.stop(context);
                assert.deepStrictEqual(context.removed, [eventName]);
            }
        });

        it('the listener holds no secret', async () => {
            const context = createContext();
            await NewRateUpdate.start(context);
            const stored = JSON.stringify(context.listeners);
            assert(!stored.includes('secret-hotel123') && !stored.includes(PARTNER_API_KEY));
        });

        it('start fails without the connector configuration or an incomplete account', async () => {
            await assert.rejects(NewRateUpdate.start(createContext({ config: {} })), CancelError);
            await assert.rejects(NewRateUpdate.start(createContext({ auth: { ...ACCOUNT, clientId: '' } })), CancelError);
        });

        it('New Rate Update sends out what the endpoint delivered, without the proof', async () => {
            const update = await delivered();
            const context = createContext({ webhook: update });
            await NewRateUpdate.receive(context);
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].port, 'out');
            assert.deepStrictEqual(context.sent[0].data, {
                room_type_code: 'DBL',
                room_type_name: 'Double Room',
                rate_plan_code: 'BAR',
                rate_plan_name: 'Best Available Rate',
                calendar: [
                    { start_date: '2024-01-01', end_date: '2024-01-01', price: 100 },
                    { start_date: '2024-01-02', end_date: '2024-01-07', prices: [{ occupancy: 1, price: 120 }, { occupancy: 2, price: 150 }] }
                ],
                event: 'rates.update',
                tracking_id: 'eec4776f-3b5c-484a-aa02-f8c525d5b706',
                property_code: 'HOTEL123',
                index: 0,
                count: 2
            });
            assert.strictEqual(context.requests.length, 0);
        });

        it('New Restriction Update sends out a delivered restriction update', async () => {
            const context = createContext({ webhook: await delivered(restrictionsPush()) });
            await NewRestrictionUpdate.receive(context);
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].data.event, 'restrictions.update');
            assert.deepStrictEqual(context.sent[0].data.calendar, [{ start_date: '2024-01-02', end_date: '2024-01-07', min_stay_arrival: 2 }]);
        });

        it('the order of the keys of a stored update does not matter', async () => {
            const update = await delivered();
            const reordered = Object.fromEntries(Object.entries(update).reverse());
            const context = createContext({ webhook: reordered });
            await NewRateUpdate.receive(context);
            assert.strictEqual(context.sent.length, 1);
        });

        it('a request posted straight to the trigger\'s webhook URL is dropped', async () => {
            const update = await delivered();
            // eslint-disable-next-line no-unused-vars
            const { deliveryProof, ...forged } = update;
            const attempts = [
                forged,
                { ...forged, deliveryProof: '' },
                { ...forged, deliveryProof: 'a'.repeat(64) },
                { ...forged, deliveryProof: lib.deliveryProof('guessed-key', 'client-hotel123', forged) },
                // A real proof does not cover a changed price, another property or another event.
                { ...update, calendar: [{ start_date: '2024-01-01', end_date: '2024-12-31', price: 1 }] },
                { ...update, room_type_code: 'SUITE' },
                { ...update, tracking_id: 'other' },
                { ...update, extra: true },
                'text',
                null,
                []
            ];
            for (const webhook of attempts) {
                const context = createContext({ webhook });
                await NewRateUpdate.receive(context);
                assert.strictEqual(context.sent.length, 0, JSON.stringify(webhook));
            }
        });

        it('a delivered update of another property or event is not sent out', async () => {
            const update = await delivered();
            const otherAccount = createContext({ auth: { propertyCode: 'HOTEL999', clientId: 'client-hotel999', clientSecret: 's' }, webhook: update });
            await NewRateUpdate.receive(otherAccount);
            assert.strictEqual(otherAccount.sent.length, 0);

            // A connection that names the same property code with another client id: an update
            // replayed to its webhook URL, proof included, is not accepted.
            const squatter = createContext({ auth: { propertyCode: 'HOTEL123', clientId: 'client-of-somebody-else', clientSecret: 's' }, webhook: update });
            await NewRateUpdate.receive(squatter);
            assert.strictEqual(squatter.sent.length, 0);

            const otherTrigger = createContext({ webhook: update });
            await NewRestrictionUpdate.receive(otherTrigger);
            assert.strictEqual(otherTrigger.sent.length, 0);

            const noConfig = createContext({ config: {}, webhook: update });
            await NewRateUpdate.receive(noConfig);
            assert.strictEqual(noConfig.sent.length, 0);
        });

        it('an item cannot bring its own proof or overwrite the envelope', async () => {
            const payload = ratesPush();
            payload.data = [{ ...payload.data[0], deliveryProof: 'x', property_code: 'HOTEL999', event: 'restrictions.update', index: 7 }];
            const update = await delivered(payload);
            assert.strictEqual(update.property_code, 'HOTEL123');
            assert.strictEqual(update.event, 'rates.update');
            assert.strictEqual(update.index, 0);
            const context = createContext({ webhook: update });
            await NewRateUpdate.receive(context);
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual('deliveryProof' in context.sent[0].data, false);
        });

        it('without a webhook message receive does nothing', async () => {
            const context = createContext({ content: {} });
            await NewRateUpdate.receive(context);
            assert.strictEqual(context.sent.length, 0);
        });

        it('test() says that there is no sample', async () => {
            for (const trigger of [NewRateUpdate, NewRestrictionUpdate]) {
                await assert.rejects(trigger.test(createContext()), (err) => err instanceof CancelError && /Flow Test Mode is not available/.test(err.message));
            }
        });
    });

    describe('helpers', () => {

        it('canonicalJson ignores key order and undefined values', () => {
            assert.strictEqual(lib.canonicalJson({ b: 1, a: [{ d: null, c: 'x' }], z: undefined }), '{"a":[{"c":"x","d":null}],"b":1}');
            assert.strictEqual(lib.canonicalJson({ a: 1, b: 2 }), lib.canonicalJson({ b: 2, a: 1 }));
        });

        it('safeEqual compares strings only and never matches an empty value', () => {
            assert.strictEqual(lib.safeEqual('abc', 'abc'), true);
            assert.strictEqual(lib.safeEqual('abc', 'abd'), false);
            assert.strictEqual(lib.safeEqual('abc', 'abcd'), false);
            assert.strictEqual(lib.safeEqual('', ''), false);
            assert.strictEqual(lib.safeEqual(undefined, undefined), false);
            assert.strictEqual(lib.safeEqual(['abc'], 'abc'), false);
        });

        it('kvToObject reads the Designer\'s JSON string, an object and rows', () => {
            const context = createContext();
            assert.deepStrictEqual(lib.kvToObject(context, '{"a":"1"}', 'Headers'), { a: '1' });
            assert.deepStrictEqual(lib.kvToObject(context, { a: '1' }, 'Headers'), { a: '1' });
            assert.deepStrictEqual(lib.kvToObject(context, [{ key: 'a', value: '1' }, { key: '', value: 'x' }], 'Headers'), { a: '1' });
            assert.deepStrictEqual(lib.kvToObject(context, '', 'Headers'), {});
            assert.throws(() => lib.kvToObject(context, '{', 'Headers'), CancelError);
        });
    });
});
