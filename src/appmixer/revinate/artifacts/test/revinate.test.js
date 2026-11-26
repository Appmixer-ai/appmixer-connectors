'use strict';

/* eslint-disable max-len */

const assert = require('assert');
const crypto = require('crypto');

const common = require('../../lib');
const porter = require('../../reputation/lib');
const cdp = require('../../cdp/lib');
const porterAuth = require('../../reputation/auth');
const cdpAuth = require('../../cdp/auth');

const FindReviews = require('../../reputation/FindReviews/FindReviews');
const FindCompetitorReviews = require('../../reputation/FindCompetitorReviews/FindCompetitorReviews');
const FindHotels = require('../../reputation/FindHotels/FindHotels');
const FindCompetitorHotels = require('../../reputation/FindCompetitorHotels/FindCompetitorHotels');
const GetHotel = require('../../reputation/GetHotel/GetHotel');
const GetReview = require('../../reputation/GetReview/GetReview');
const GetReviewsSnapshot = require('../../reputation/GetReviewsSnapshot/GetReviewsSnapshot');
const GetSentimentByTopic = require('../../reputation/GetSentimentByTopic/GetSentimentByTopic');
const ListReviewSites = require('../../reputation/ListReviewSites/ListReviewSites');
const NewReview = require('../../reputation/NewReview/NewReview');
const UpdatedReview = require('../../reputation/UpdatedReview/UpdatedReview');
const PorterMakeApiCall = require('../../reputation/MakeApiCall/MakeApiCall');

const FindGuestProfiles = require('../../cdp/FindGuestProfiles/FindGuestProfiles');
const GetGuestProfile = require('../../cdp/GetGuestProfile/GetGuestProfile');
const FindReservations = require('../../cdp/FindReservations/FindReservations');
const UpdatedGuestProfile = require('../../cdp/UpdatedGuestProfile/UpdatedGuestProfile');
const UpdatedReservation = require('../../cdp/UpdatedReservation/UpdatedReservation');
const CdpMakeApiCall = require('../../cdp/MakeApiCall/MakeApiCall');

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

const PORTER = 'https://porter.revinate.com';
const CDP = 'https://api.revinate.com';
const MINUTE = 60 * 1000;

// The sample of https://porter.revinate.com/documentation#intro-auth.
const SAMPLE = {
    username: 'test_user@revinate.com',
    timestamp: 1420765002,
    apiKey: 'd87b88ceefbcf9d2b2adfb2bbbde1234',
    apiSecret: 'b7536617fa4a1a9e3c7a707abcde866771570cb8c9a28401abcde755b48be6cb',
    encoded: '753b2b64fc91ab26484d67b67eeae4f5588ce4d5b107346308a7421246c8fff8'
};

const PORTER_AUTH = { username: SAMPLE.username, apiKey: SAMPLE.apiKey, apiSecret: SAMPLE.apiSecret };
const CDP_AUTH = { clientId: 'client-1', clientSecret: 'secret-1', accountId: '1928376' };

// A response that is an Error makes httpRequest reject with it. A function is called with the request.
const createContext = ({ auth = PORTER_AUTH, content = {}, properties = {}, state = {}, responses = [] } = {}) => {

    const context = {
        auth,
        config: {},
        properties,
        state: { ...state },
        componentId: 'component-1',
        flowId: 'flow-1',
        flowDescriptor: { 'component-1': { label: 'Find' } },
        messages: { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        logs: [],
        files: [],
        cache: {},
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
        async log(entry) {
            this.logs.push(entry);
        },
        async lock() {
            return { async unlock() {} };
        },
        staticCache: {
            get: async key => context.cache[key],
            set: async (key, value, ttl) => {
                context.cache[key] = value;
                context.cacheTtl = ttl;
            }
        },
        async saveState(newState) {
            this.state = { ...newState };
        },
        async saveFileStream(name, buffer) {
            this.files.push({ name, content: buffer.toString('utf8') });
            return { fileId: 'file-1' };
        }
    };
    return context;
};

// The context auth.js callbacks get: the fields sit on the context, there is no "auth", no
// CancelError, no cache and no lock.
const createAuthContext = (fields, responses = []) => ({
    ...fields,
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

const httpError = (status, data, headers = {}) => Object.assign(new Error('Request failed with status code ' + status), {
    response: { status, data, headers }
});

const page = (content, totalPages = 1) => ({
    data: { content, page: { size: content.length, totalElements: content.length, totalPages, number: 0 }, links: [] }
});

const review = (id, extra = {}) => ({
    title: `Review ${id}`,
    rating: 4,
    dateCollected: 1795392000,
    updatedAt: 1795392000,
    reviewSite: { name: 'TripAdvisor', slug: 'tripadvisor', links: [{ rel: 'self', href: `${PORTER}/reviewsites/3` }] },
    language: { name: 'English', slug: 'en', links: [{ rel: 'self', href: `${PORTER}/languages/1` }] },
    links: [
        { rel: 'self', href: `${PORTER}/reviews/${id}` },
        { rel: 'hotel', href: `${PORTER}/hotels/10470` }
    ],
    ...extra
});

const hotel = (id, name) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    links: [
        { rel: 'self', href: `${PORTER}/hotels/${id}` },
        { rel: 'reviews', href: `${PORTER}/hotels/${id}/reviews{?page,size,sort}`, templated: true }
    ]
});

const tokenResponse = (token = 'token-1', expiresIn = 86400) => ({
    data: { access_token: token, scope: 'read:apiout', expires_in: expiresIn, token_type: 'Bearer' }
});

const cdpPage = (data, { number = 1, totalPages = 1 } = {}) => ({
    data: { meta: { page: { number, limit: 100, total_records: 1, total_pages: totalPages } }, data }
});

const profile = (id, modified, extra = {}) => ({
    revinate_rich_guest_profile_id: id,
    revinate_last_modified_at: modified,
    first_name: 'John',
    contact_info: {
        email_addresses: [{ email_address_reference: { email_address_id: { email_address: `${id}@example.com` } } }],
        phone_numbers: [{ phone_number_reference: { phone_number_id: { phone_number: '(702)-234-5566' } } }]
    },
    ...extra
});

const query = (request) => new URL(request.url).searchParams;

describe('Revinate', function() {

    let realNow;

    beforeEach(function() {
        realNow = Date.now;
        porter.resetClock();
    });

    afterEach(function() {
        Date.now = realNow;
        porter.resetClock();
    });

    describe('shared lib', function() {

        it('builds a query string, repeating the key of an array and dropping empty values', function() {
            assert.strictEqual(common.toQueryString({ a: 1, b: '', c: undefined, d: null, 'ids[]': ['x', 'y'] }), '?a=1&ids%5B%5D=x&ids%5B%5D=y');
            assert.strictEqual(common.toQueryString({}), '');
            assert.strictEqual(common.toQueryString({ date: '1..2', sort: 'rating,DESC' }), '?date=1..2&sort=rating%2CDESC');
        });

        it('pins a user supplied URL to one origin', function() {
            const context = createContext();
            assert.strictEqual(common.resolveApiUrl(context, PORTER, '/hotels?size=1'), PORTER + '/hotels?size=1');
            assert.strictEqual(common.resolveApiUrl(context, PORTER, 'hotels'), PORTER + '/hotels');
            assert.strictEqual(common.resolveApiUrl(context, PORTER, PORTER + '/reviews/1'), PORTER + '/reviews/1');
            for (const bad of [
                'https://evil.example/hotels', '//evil.example/hotels', '\\\\evil.example\\hotels',
                'https://porter.revinate.com.evil.example/x', 'https://user:pass@porter.revinate.com/hotels',
                'http://porter.revinate.com/hotels', 'https://porter.revinate.com:8443/hotels', 'https://api.revinate.com/x',
                'javascript:alert(1)'
            ]) {
                assert.throws(() => common.resolveApiUrl(context, PORTER, bad), CancelError, bad);
            }
        });

        it('refuses IDs that could change the path of a request', function() {
            const context = createContext();
            assert.strictEqual(common.requireNumericId(context, ' 10470 ', 'Hotel'), '10470');
            assert.strictEqual(common.requireNumericId(context, 10470, 'Hotel'), '10470');
            assert.throws(() => common.requireNumericId(context, '1/../../reviews', 'Hotel'), CancelError);
            assert.throws(() => common.requireNumericId(context, '1?size=1000', 'Hotel'), CancelError);
            assert.throws(() => common.requireNumericId(context, ' ', 'Hotel'), /Hotel is required/);
        });

        it('writes CSV with the columns of all records and RFC 4180 quoting', function() {
            const csv = common.toCsv([{ id: 1, title: 'He said "hi", twice' }, { id: 2, rating: 5, tags: ['a', 'b'] }]);
            assert.strictEqual(csv, 'id,title,rating,tags\n1,"He said ""hi"", twice",,\n2,,5,"[""a"",""b""]"');
            assert.strictEqual(common.toCsv([]), '');
        });

        it('parses a key-value input stored as a JSON string and drops reserved headers in any spelling', function() {
            const context = createContext();
            assert.deepStrictEqual(common.kvToObject(context, '{"Accept":"application/json"}', 'Headers'), { Accept: 'application/json' });
            assert.deepStrictEqual(common.kvToObject(context, [{ key: 'a', value: 1 }], 'Headers'), { a: 1 });
            assert.deepStrictEqual(common.kvToObject(context, '', 'Headers'), {});
            assert.throws(() => common.kvToObject(context, 'nope', 'Headers'), CancelError);
            assert.deepStrictEqual(
                common.withoutReservedHeaders({ authorization: 'x', 'X-ACCOUNT-ID': '1', Accept: 'a' }, ['Authorization', 'X-Account-Id']),
                { Accept: 'a' }
            );
        });
    });

    describe('pollWindow', function() {

        const T0 = 1795392000000;
        const item = (id, time) => ({ id, time });
        const options = (fetchPage, extra = {}) => ({
            fetchPage, getTime: r => r.time, getKey: r => String(r.id), intervalMs: 15 * MINUTE, overlapMs: 5 * MINUTE, ...extra
        });

        it('takes a baseline on the first check without a request', async function() {
            const context = createContext({ state: {} });
            let calls = 0;
            const result = await common.pollWindow(context, options(async () => {
                calls++;
                return { records: [], totalPages: 1 };
            }, { now: T0 }));
            assert.strictEqual(calls, 0);
            assert.deepStrictEqual(result.emit, []);
            assert.deepStrictEqual(result.state, { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] });
        });

        it('skips checks that come sooner than the interval and keeps the state', async function() {
            const context = createContext({ state: { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] } });
            let calls = 0;
            const result = await common.pollWindow(context, options(async () => {
                calls++;
                return { records: [], totalPages: 1 };
            }, { now: T0 + 14 * MINUTE }));
            assert.strictEqual(calls, 0);
            assert.strictEqual(result.state, null);
        });

        it('reads the window since the last check with an overlap, and an empty account still fires its first record', async function() {
            const context = createContext({ state: { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] } });
            const windows = [];
            const result = await common.pollWindow(context, options(async (from, to, index) => {
                windows.push([from, to, index]);
                return { records: [item(1, T0 + MINUTE)], totalPages: 1 };
            }, { now: T0 + 15 * MINUTE }));
            assert.deepStrictEqual(windows, [[T0 - 5 * MINUTE, T0 + 15 * MINUTE, 0]]);
            assert.deepStrictEqual(result.emit, [item(1, T0 + MINUTE)]);
            // Record 1 is older than the next overlap, so it does not have to be remembered.
            assert.deepStrictEqual(result.state, {
                initialized: true, lastTimestamp: T0 + 15 * MINUTE, lastPollAt: T0 + 15 * MINUTE, known: []
            });
        });

        it('does not fire a record of the overlap twice, and fires it again under a new key', async function() {
            const first = createContext({ state: { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] } });
            const late = item(7, T0 + 14 * MINUTE);
            const one = await common.pollWindow(first, options(async () => ({ records: [late], totalPages: 1 }), { now: T0 + 15 * MINUTE }));
            assert.deepStrictEqual(one.emit, [late]);
            assert.deepStrictEqual(one.state.known, [['7', T0 + 14 * MINUTE]]);

            const second = createContext({ state: one.state });
            const two = await common.pollWindow(second, options(async () => ({ records: [late], totalPages: 1 }), { now: T0 + 30 * MINUTE }));
            assert.deepStrictEqual(two.emit, []);
            assert.deepStrictEqual(two.state.known, []);

            const third = createContext({ state: one.state });
            const three = await common.pollWindow(third, {
                ...options(async () => ({ records: [{ ...late, version: 2 }], totalPages: 1 }), { now: T0 + 30 * MINUTE }),
                getKey: r => `${r.id}@${r.version || 1}`
            });
            assert.strictEqual(three.emit.length, 1);
        });

        it('reads all pages, drops duplicates across pages and emits oldest first', async function() {
            const context = createContext({ state: { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] } });
            const pages = [[item(3, T0 + 3000), item(1, T0 + 1000)], [item(1, T0 + 1000), item(2, T0 + 2000)], []];
            const indexes = [];
            const result = await common.pollWindow(context, options(async (from, to, index) => {
                indexes.push(index);
                return { records: pages[index], totalPages: 3 };
            }, { now: T0 + 15 * MINUTE }));
            assert.deepStrictEqual(indexes, [0, 1, 2]);
            assert.deepStrictEqual(result.emit.map(r => r.id), [1, 2, 3]);
            assert.strictEqual(result.truncated, false);
        });

        it('halves the new part of the window until it fits and continues from there', async function() {
            const context = createContext({ state: { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] } });
            const ends = [];
            const result = await common.pollWindow(context, options(async (from, to, index) => {
                if (index === 0) {
                    ends.push(to - T0);
                }
                // More than maxPages pages unless the window ends within 4 minutes of the last check.
                return { records: [], totalPages: to - T0 > 4 * MINUTE ? 5 : 1 };
            }, { now: T0 + 16 * MINUTE, maxPages: 2 }));
            assert.deepStrictEqual(ends, [16 * MINUTE, 8 * MINUTE, 4 * MINUTE]);
            assert.strictEqual(result.state.lastTimestamp, T0 + 4 * MINUTE);
            assert.strictEqual(result.truncated, false);
        });

        it('never moves the window end behind the last check and reports what it could not read', async function() {
            const context = createContext({ state: { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] } });
            let pagesRead = 0;
            const result = await common.pollWindow(context, options(async (from, to, index) => {
                pagesRead = Math.max(pagesRead, index + 1);
                return { records: [item(`${to}-${index}`, T0)], totalPages: 50 };
            }, { now: T0 + 15 * MINUTE, maxPages: 3 }));
            assert.strictEqual(result.state.lastTimestamp, T0 + 1000);
            assert.strictEqual(pagesRead, 3);
            assert.strictEqual(result.truncated, true);
        });
    });

    describe('Reputation: request signing', function() {

        it('reproduces the digest of the documented sample', function() {
            assert.strictEqual(porter.sign(SAMPLE.username, SAMPLE.apiSecret, SAMPLE.timestamp), SAMPLE.encoded);
            assert.deepStrictEqual(porter.authHeaders({ auth: PORTER_AUTH }, SAMPLE.timestamp), {
                'X-Revinate-Porter-Username': SAMPLE.username,
                'X-Revinate-Porter-Timestamp': '1420765002',
                'X-Revinate-Porter-Key': SAMPLE.apiKey,
                'X-Revinate-Porter-Encoded': SAMPLE.encoded
            });
        });

        it('uses the secret as a string: hex-decoding it gives another digest', function() {
            const hexKeyed = crypto.createHmac('sha256', Buffer.from(SAMPLE.apiSecret, 'hex'))
                .update(SAMPLE.username + SAMPLE.timestamp).digest('hex');
            assert.notStrictEqual(hexKeyed, SAMPLE.encoded);
        });

        it('reads the credentials of a component and of auth.js, trimmed', function() {
            const padded = { username: ` ${SAMPLE.username} `, apiKey: ` ${SAMPLE.apiKey}\n`, apiSecret: ` ${SAMPLE.apiSecret} ` };
            assert.strictEqual(porter.authHeaders({ auth: padded }, SAMPLE.timestamp)['X-Revinate-Porter-Encoded'], SAMPLE.encoded);
            assert.strictEqual(porter.authHeaders(padded, SAMPLE.timestamp)['X-Revinate-Porter-Encoded'], SAMPLE.encoded);
            assert.strictEqual(porter.authHeaders(padded, SAMPLE.timestamp)['X-Revinate-Porter-Key'], SAMPLE.apiKey);
        });

        it('signs every request with the current time in seconds', async function() {
            const context = createContext({ responses: [page([]), page([])] });
            Date.now = () => 1795392000123;
            await porter.request(context, { path: '/hotels' });
            Date.now = () => 1795392061999;
            await porter.request(context, { path: '/hotels' });
            const [first, second] = context.requests.map(r => r.headers);
            assert.strictEqual(first['X-Revinate-Porter-Timestamp'], '1795392000');
            assert.strictEqual(second['X-Revinate-Porter-Timestamp'], '1795392061');
            assert.strictEqual(first['X-Revinate-Porter-Encoded'], porter.sign(SAMPLE.username, SAMPLE.apiSecret, 1795392000));
            assert.notStrictEqual(first['X-Revinate-Porter-Encoded'], second['X-Revinate-Porter-Encoded']);
        });

        it('always calls the Porter origin with GET', async function() {
            const context = createContext({ responses: [page([])] });
            await porter.request(context, { path: '/hotels', params: { size: 1 } });
            assert.strictEqual(context.requests[0].url, PORTER + '/hotels?size=1');
            assert.strictEqual(context.requests[0].method, 'GET');
        });
    });

    describe('Reputation: clock skew', function() {

        const LOCAL = 1795392000000;

        it('repeats a 401 once with Revinate\'s time when the clocks differ, and keeps the correction', async function() {
            // This machine is 10 minutes behind Revinate.
            const server = LOCAL + 10 * MINUTE;
            const context = createContext({
                responses: [
                    httpError(401, { timestamp: server, status: 401, error: 'Unauthorized', message: 'Invalid timestamp' }),
                    page([]),
                    page([])
                ]
            });
            Date.now = () => LOCAL;
            await porter.request(context, { path: '/hotels' });
            await porter.request(context, { path: '/hotels' });
            const stamps = context.requests.map(r => r.headers['X-Revinate-Porter-Timestamp']);
            assert.deepStrictEqual(stamps, [String(LOCAL / 1000), String(server / 1000), String(server / 1000)]);
            assert.strictEqual(
                context.requests[1].headers['X-Revinate-Porter-Encoded'],
                porter.sign(SAMPLE.username, SAMPLE.apiSecret, server / 1000)
            );
        });

        it('reads Revinate\'s time from the Date header when the body has none', async function() {
            const server = LOCAL - 8 * MINUTE;
            const context = createContext({
                responses: [httpError(401, 'Unauthorized', { date: new Date(server).toUTCString() }), page([])]
            });
            Date.now = () => LOCAL;
            await porter.request(context, { path: '/hotels' });
            assert.strictEqual(context.requests[1].headers['X-Revinate-Porter-Timestamp'], String(server / 1000));
        });

        it('does not repeat a 401 when the clocks agree: the credentials are wrong', async function() {
            const context = createContext({
                responses: [httpError(401, { timestamp: LOCAL + 2000, status: 401, error: 'Unauthorized', message: 'Username does not exist' })]
            });
            Date.now = () => LOCAL;
            await assert.rejects(porter.request(context, { path: '/hotels' }), (err) => {
                assert.ok(err instanceof CancelError);
                assert.match(err.message, /HTTP 401: Username does not exist/);
                return true;
            });
            assert.strictEqual(context.requests.length, 1);
        });

        it('repeats at most once, and never for another status', async function() {
            const server = LOCAL + 10 * MINUTE;
            const body = { timestamp: server, status: 401, message: 'Unauthorized' };
            const twice = createContext({ responses: [httpError(401, body), httpError(401, body)] });
            Date.now = () => LOCAL;
            await assert.rejects(porter.request(twice, { path: '/hotels' }), CancelError);
            assert.strictEqual(twice.requests.length, 2);

            const notFound = createContext({ responses: [httpError(404, { timestamp: LOCAL - 60 * MINUTE, status: 404, message: 'Not Found' })] });
            await assert.rejects(porter.request(notFound, { path: '/hotels/1' }), /did not find/);
            assert.strictEqual(notFound.requests.length, 1);
        });

        it('keeps a server error retriable', async function() {
            const context = createContext({ responses: [httpError(503, 'unavailable')] });
            await assert.rejects(porter.request(context, { path: '/hotels' }), (err) => {
                assert.ok(!(err instanceof CancelError));
                return true;
            });
        });
    });

    describe('Reputation: IDs from links', function() {

        it('reads the ID from the self link, also from a templated or decorated one', function() {
            assert.strictEqual(porter.idFromLinks([{ rel: 'self', href: `${PORTER}/reviews/482930112` }], 'self'), 482930112);
            assert.strictEqual(porter.idFromLinks([{ rel: 'self', href: `${PORTER}/hotels/10470{?page,size}`, templated: true }], 'self'), 10470);
            assert.strictEqual(porter.idFromLinks([{ rel: 'self', href: `${PORTER}/hotels/10470/?x=1#top` }], 'self'), 10470);
            assert.strictEqual(porter.idFromLinks([{ rel: 'hotel', href: '/hotels/7' }, { rel: 'self', href: '/reviews/9' }], 'hotel'), 7);
        });

        it('returns nothing for a missing, empty or non-numeric link', function() {
            assert.strictEqual(porter.idFromLinks(undefined, 'self'), undefined);
            assert.strictEqual(porter.idFromLinks([], 'self'), undefined);
            assert.strictEqual(porter.idFromLinks([{ rel: 'self' }], 'self'), undefined);
            assert.strictEqual(porter.idFromLinks([{ rel: 'self', href: `${PORTER}/reviews/latest` }], 'self'), undefined);
            assert.strictEqual(porter.idFromLinks([{ rel: 'self', href: `${PORTER}/hotels/10470/reviews` }], 'self'), undefined);
            assert.strictEqual(porter.idFromLinks([{ rel: 'other', href: `${PORTER}/reviews/1` }], 'self'), undefined);
        });

        it('adds id, hotelId and the IDs of the review site and language to a review', function() {
            const mapped = porter.mapReview(review(482930112));
            assert.strictEqual(mapped.id, 482930112);
            assert.strictEqual(mapped.hotelId, 10470);
            assert.strictEqual(mapped.reviewSite.id, 3);
            assert.strictEqual(mapped.language.id, 1);
            assert.strictEqual(mapped.title, 'Review 482930112');
        });

        it('leaves a review without links usable and gives it a stable key', function() {
            const bare = { title: 'No links', author: 'Jane', dateCollected: 1795392000, crawledUrl: 'https://example.com/r/1' };
            const mapped = porter.mapReview(bare);
            assert.ok(!('id' in mapped));
            assert.ok(!('hotelId' in mapped));
            const key = porter.reviewKey(mapped);
            assert.match(key, /^h:[0-9a-f]{64}$/);
            assert.strictEqual(porter.reviewKey(porter.mapReview({ ...bare, rating: 5, updatedAt: 1 })), key);
            assert.notStrictEqual(porter.reviewKey(porter.mapReview({ ...bare, crawledUrl: 'https://example.com/r/2' })), key);
            assert.strictEqual(porter.reviewKey(porter.mapReview(review(5))), '5');
        });
    });

    describe('Reputation: components', function() {

        it('Find Reviews reads one page of all hotels with the chosen filters', async function() {
            const context = createContext({
                content: {
                    ratings: ['1', '2'], feedback: 'negative', response: 'none', reviewSiteSlug: ' tripadvisor ', languageSlug: 'en',
                    collectedFrom: '2026-11-01T00:00:00.000Z', collectedTo: '2026-11-20T00:00:00.000Z',
                    sortBy: 'rating', sortDirection: 'ASC', outputType: 'array'
                },
                responses: [page([review(1), review(2)])]
            });
            await FindReviews.receive(context);
            const url = new URL(context.requests[0].url);
            assert.strictEqual(url.origin + url.pathname, PORTER + '/reviews');
            assert.deepStrictEqual(Object.fromEntries(url.searchParams), {
                ratings: '1,2', feedback: 'negative', response: 'none', languageSlug: 'en', reviewSiteSlug: 'tripadvisor',
                dateCollected: '1793491200..1795132800', sort: 'rating,ASC', page: '0', size: '100'
            });
            assert.strictEqual(context.sent[0].port, 'out');
            assert.strictEqual(context.sent[0].data.count, 2);
            assert.deepStrictEqual(context.sent[0].data.result.map(r => r.id), [1, 2]);
        });

        it('Find Reviews reads the reviews of one hotel, sends no sort unless asked and accepts ratings from a variable', async function() {
            const context = createContext({
                content: { hotelId: '10470', ratings: '4, 5', updatedFrom: '2026-11-01T00:00:00.000Z', outputType: 'first' },
                responses: [page([review(1)])]
            });
            Date.now = () => 1795392000000;
            await FindReviews.receive(context);
            const url = new URL(context.requests[0].url);
            assert.strictEqual(url.pathname, '/hotels/10470/reviews');
            assert.deepStrictEqual(Object.fromEntries(url.searchParams), {
                ratings: '4,5', updatedAt: '1793491200..1795392000', page: '0', size: '100'
            });
            assert.strictEqual(context.sent[0].data.id, 1);
            assert.strictEqual(context.sent[0].data.index, 0);
        });

        it('Find Reviews sends to notFound for an empty page and refuses bad input before any request', async function() {
            const empty = createContext({ content: { outputType: 'array' }, responses: [page([])] });
            await FindReviews.receive(empty);
            assert.deepStrictEqual(empty.sent, [{ data: {}, port: 'notFound' }]);

            for (const content of [
                { hotelId: '1/../../hotels' },
                { ratings: ['6'] },
                { collectedFrom: 'not a date' },
                { collectedFrom: '2026-11-20T00:00:00.000Z', collectedTo: '2026-11-01T00:00:00.000Z' }
            ]) {
                const context = createContext({ content });
                await assert.rejects(FindReviews.receive(context), CancelError, JSON.stringify(content));
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('Find Reviews fails loudly on an answer that is not a page', async function() {
            const context = createContext({ content: {}, responses: [{ data: { error: 'x' } }] });
            await assert.rejects(FindReviews.receive(context), /unexpected answer/);
            assert.strictEqual(context.sent.length, 0);
        });

        it('Find Reviews writes a CSV file', async function() {
            const context = createContext({ content: { outputType: 'file' }, responses: [page([review(1)])] });
            await FindReviews.receive(context);
            assert.strictEqual(context.files[0].name, 'revinate-objects-export-Find.csv');
            assert.ok(context.files[0].content.startsWith('id,title,rating,'));
            assert.deepStrictEqual(context.sent[0].data, { fileId: 'file-1' });
        });

        it('Find components return their output options without a request', async function() {
            for (const component of [FindReviews, FindCompetitorReviews, FindHotels, FindCompetitorHotels, FindGuestProfiles, FindReservations]) {
                const context = createContext({ content: { outputType: 'object', hotelId: 'dummy' }, properties: { generateOutputPortOptions: true } });
                await component.receive(context);
                assert.strictEqual(context.requests.length, 0);
                assert.strictEqual(context.sent[0].data[0].value, 'index');
                assert.ok(context.sent[0].data.length > 5);
            }
        });

        it('Find Competitor Reviews needs a hotel and filters by competitor', async function() {
            const missing = createContext({ content: {} });
            await assert.rejects(FindCompetitorReviews.receive(missing), /Hotel is required/);
            assert.strictEqual(missing.requests.length, 0);

            const context = createContext({ content: { hotelId: 10470, competitorHotelSlug: 'the-other-hotel' }, responses: [page([review(9)])] });
            await FindCompetitorReviews.receive(context);
            const url = new URL(context.requests[0].url);
            assert.strictEqual(url.pathname, '/hotels/10470/competitorreviews');
            assert.deepStrictEqual(Object.fromEntries(url.searchParams), { competitorHotelSlug: 'the-other-hotel', page: '0', size: '100' });
        });

        it('Find Hotels reads the maximum page and matches the name itself', async function() {
            const context = createContext({
                content: { name: 'harbor' },
                responses: [page([hotel(1, 'Harbor View Hotel'), hotel(2, 'Mountain Lodge')])]
            });
            await FindHotels.receive(context);
            assert.strictEqual(context.requests[0].url, PORTER + '/hotels?page=0&size=1000');
            assert.deepStrictEqual(context.sent[0].data.result.map(h => [h.id, h.name]), [[1, 'Harbor View Hotel']]);

            const none = createContext({ content: { name: 'zzz' }, responses: [page([hotel(1, 'Harbor View Hotel')])] });
            await FindHotels.receive(none);
            assert.strictEqual(none.sent[0].port, 'notFound');
        });

        it('Find Hotels as a dropdown source is cached per account and shows nothing on an error', async function() {
            const context = createContext({ properties: { isSource: true }, responses: [page([hotel(1, 'Harbor View Hotel'), { name: 'No link' }])] });
            await FindHotels.receive(context);
            await FindHotels.receive(context);
            assert.strictEqual(context.requests.length, 1);
            assert.deepStrictEqual(context.sent[1].data, { result: [{ id: 1, name: 'Harbor View Hotel' }] });
            assert.deepStrictEqual(FindHotels.toSelectArray(context.sent[1].data), [{ label: 'Harbor View Hotel (1)', value: '1' }]);

            // Another account does not get the first account's hotels.
            context.auth = { ...PORTER_AUTH, username: 'other@example.com' };
            await FindHotels.receive(context);
            assert.strictEqual(context.requests.length, 2);

            const failing = createContext({ properties: { isSource: true }, responses: [httpError(401, { message: 'Username does not exist' })] });
            await FindHotels.receive(failing);
            assert.deepStrictEqual(failing.sent[0].data, { result: [] });
            assert.deepStrictEqual(FindHotels.toSelectArray({}), []);
        });

        it('Find Competitor Hotels reads the competitor set of one hotel', async function() {
            const context = createContext({ content: { hotelId: '10470' }, responses: [page([hotel(5, 'Rival Inn')])] });
            await FindCompetitorHotels.receive(context);
            assert.strictEqual(context.requests[0].url, PORTER + '/hotels/10470/competitorhotels?page=0&size=1000');
            assert.strictEqual(context.sent[0].data.result[0].id, 5);
        });

        it('Get Hotel and Get Review return the ID that was asked for when the answer has no self link', async function() {
            const hotelContext = createContext({ content: { hotelId: '10470' }, responses: [{ data: { name: 'Harbor View Hotel' } }] });
            await GetHotel.receive(hotelContext);
            assert.strictEqual(hotelContext.requests[0].url, PORTER + '/hotels/10470');
            assert.deepStrictEqual(hotelContext.sent[0].data, { id: 10470, name: 'Harbor View Hotel' });

            const reviewContext = createContext({ content: { reviewId: 77 }, responses: [{ data: review(77) }] });
            await GetReview.receive(reviewContext);
            assert.strictEqual(reviewContext.requests[0].url, PORTER + '/reviews/77');
            assert.strictEqual(reviewContext.sent[0].data.id, 77);
            assert.strictEqual(reviewContext.sent[0].data.hotelId, 10470);

            const missing = createContext({ content: {} });
            await assert.rejects(GetReview.receive(missing), /Review ID is required/);
            const injected = createContext({ content: { reviewId: '77/../../hotels' } });
            await assert.rejects(GetReview.receive(injected), CancelError);
            assert.strictEqual(injected.requests.length, 0);
        });

        it('Get Review turns a 404 into a CancelError with Revinate\'s message', async function() {
            const context = createContext({ content: { reviewId: '1' }, responses: [httpError(404, { status: 404, error: 'Not Found', message: 'No review 1' })] });
            await assert.rejects(GetReview.receive(context), (err) => {
                assert.ok(err instanceof CancelError);
                assert.match(err.message, /did not find.*HTTP 404: No review 1/);
                return true;
            });
        });

        it('the snapshot components send the period as epoch seconds, or no date at all', async function() {
            const ranged = createContext({
                content: { hotelId: '10470', startDate: '2026-11-01T00:00:00.000Z', endDate: '2026-11-20T00:00:00.000Z' },
                responses: [{ data: { aggregateValues: { newReviews: 3 } } }]
            });
            await GetReviewsSnapshot.receive(ranged);
            assert.strictEqual(ranged.requests[0].url, PORTER + '/hotels/10470/reviewssnapshot?date=1793491200..1795132800');
            assert.deepStrictEqual(ranged.sent[0].data, { aggregateValues: { newReviews: 3 } });

            const open = createContext({ content: { hotelId: '10470' }, responses: [{ data: {} }] });
            await GetReviewsSnapshot.receive(open);
            assert.strictEqual(open.requests[0].url, PORTER + '/hotels/10470/reviewssnapshot');

            const topics = createContext({ content: { hotelId: '10470', topicCategoryId: '12', reviewSiteSlug: 'tripadvisor' }, responses: [{ data: { topics: [] } }] });
            await GetSentimentByTopic.receive(topics);
            assert.strictEqual(topics.requests[0].url, PORTER + '/hotels/10470/topicssnapshot?topicCategoryId=12&reviewSiteSlug=tripadvisor');

            const bad = createContext({ content: { hotelId: '10470', topicCategoryId: '12&x=1' } });
            await assert.rejects(GetSentimentByTopic.receive(bad), CancelError);
            assert.strictEqual(bad.requests.length, 0);
        });

        it('the private dropdown sources are cached, hide errors only for the dropdown, and skip entries without a slug', async function() {
            const context = createContext({
                properties: { isSource: true },
                responses: [page([{ name: 'TripAdvisor', slug: 'tripadvisor', links: [{ rel: 'self', href: `${PORTER}/reviewsites/3` }] }, { name: 'Broken' }])]
            });
            await ListReviewSites.receive(context);
            await ListReviewSites.receive(context);
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.requests[0].url, PORTER + '/reviewsites?page=0&size=1000');
            assert.deepStrictEqual(ListReviewSites.toSelectArray(context.sent[0].data), [{ label: 'TripAdvisor', value: 'tripadvisor' }]);

            const hidden = createContext({ properties: { isSource: true }, responses: [httpError(500, 'x')] });
            await ListReviewSites.receive(hidden);
            assert.deepStrictEqual(hidden.sent[0].data, { items: [] });

            const loud = createContext({ responses: [httpError(500, 'x')] });
            await assert.rejects(ListReviewSites.receive(loud));
        });

        it('Make API Call signs the request and never leaves the Porter origin', async function() {
            const context = createContext({
                content: {
                    url: '/hotelsets', method: 'GET', parameters: '{"size":"5"}',
                    headers: '{"Accept":"application/json","x-revinate-porter-key":"stolen","X-Revinate-Porter-Username":"someone"}'
                },
                responses: [{ status: 200, headers: { 'content-type': 'application/json' }, data: { content: [] } }]
            });
            Date.now = () => 1795392000000;
            await PorterMakeApiCall.receive(context);
            const request = context.requests[0];
            assert.strictEqual(request.url, PORTER + '/hotelsets');
            assert.deepStrictEqual(request.params, { size: '5' });
            assert.deepStrictEqual(request.headers, {
                Accept: 'application/json',
                'X-Revinate-Porter-Username': SAMPLE.username,
                'X-Revinate-Porter-Timestamp': '1795392000',
                'X-Revinate-Porter-Key': SAMPLE.apiKey,
                'X-Revinate-Porter-Encoded': porter.sign(SAMPLE.username, SAMPLE.apiSecret, 1795392000)
            });
            assert.deepStrictEqual(context.sent[0].data, { statusCode: 200, headers: { 'content-type': 'application/json' }, body: { content: [] } });

            for (const url of ['https://evil.example/hotels', '//evil.example/hotels', 'https://api.revinate.com/api/v2/reservations']) {
                const foreign = createContext({ content: { url, method: 'GET' } });
                await assert.rejects(PorterMakeApiCall.receive(foreign), CancelError);
                assert.strictEqual(foreign.requests.length, 0);
            }
            await assert.rejects(PorterMakeApiCall.receive(createContext({ content: { method: 'GET' } })), /API Endpoint Path is required/);
            await assert.rejects(PorterMakeApiCall.receive(createContext({ content: { url: '/hotels' } })), /HTTP Method is required/);
        });
    });

    describe('Reputation: triggers', function() {

        const T0 = 1795392000000;
        const at = (minutes) => Math.floor((T0 + minutes * MINUTE) / 1000);

        it('New Review: baseline without a request, then only reviews collected afterwards, each once', async function() {
            const context = createContext({ properties: { hotelId: '10470', ratings: ['1', '2'], pollingInterval: 15 } });

            Date.now = () => T0;
            await NewReview.tick(context);
            assert.strictEqual(context.requests.length, 0);
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.state.initialized, true);

            // Too early: no request.
            Date.now = () => T0 + 5 * MINUTE;
            await NewReview.tick(context);
            assert.strictEqual(context.requests.length, 0);

            context.httpRequest = async function(options) {
                this.requests.push(options);
                return { status: 200, headers: {}, ...page([review(2, { dateCollected: at(14) }), review(1, { dateCollected: at(3) })]) };
            };
            Date.now = () => T0 + 15 * MINUTE;
            await NewReview.tick(context);
            const url = new URL(context.requests[0].url);
            assert.strictEqual(url.pathname, '/hotels/10470/reviews');
            assert.deepStrictEqual(Object.fromEntries(url.searchParams), {
                ratings: '1,2', dateCollected: `${at(-5)}..${at(15)}`, sort: 'dateCollected,ASC', page: '0', size: '100'
            });
            assert.deepStrictEqual(context.sent.map(s => s.data.id), [1, 2]);
            assert.ok(context.sent.every(s => s.port === 'out'));

            // The next check reads review 2 again (it is inside the overlap) and must not fire it.
            Date.now = () => T0 + 30 * MINUTE;
            await NewReview.tick(context);
            assert.strictEqual(context.requests.length, 2);
            assert.deepStrictEqual(context.sent.map(s => s.data.id), [1, 2]);
        });

        it('New Review: a review without a self link fires once, not on every check', async function() {
            const bare = { title: 'No links', author: 'Jane', crawledUrl: 'https://example.com/r/1', dateCollected: at(14) };
            const context = createContext({
                properties: {},
                state: { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] }
            });
            context.httpRequest = async function(options) {
                this.requests.push(options);
                return { status: 200, headers: {}, ...page([bare]) };
            };
            Date.now = () => T0 + 15 * MINUTE;
            await NewReview.tick(context);
            Date.now = () => T0 + 30 * MINUTE;
            await NewReview.tick(context);
            assert.strictEqual(context.requests.length, 2);
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(new URL(context.requests[0].url).pathname, '/reviews');
        });

        it('New Review: a failed check keeps the state, so nothing is lost', async function() {
            const state = { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] };
            const context = createContext({ properties: {}, state, responses: [httpError(503, 'unavailable')] });
            Date.now = () => T0 + 15 * MINUTE;
            await assert.rejects(NewReview.tick(context));
            assert.deepStrictEqual(context.state, state);

            const broken = createContext({ properties: {}, state, responses: [{ data: { message: 'maintenance' } }] });
            await assert.rejects(NewReview.tick(broken), /unexpected answer/);
            assert.deepStrictEqual(broken.state, state);
        });

        it('Updated Review: polls updatedAt and fires the same review again when it changes again', async function() {
            const context = createContext({
                properties: { response: 'posted', pollingInterval: '15' },
                state: { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] }
            });
            let answer = [review(1, { updatedAt: at(14) })];
            context.httpRequest = async function(options) {
                this.requests.push(options);
                return { status: 200, headers: {}, ...page(answer) };
            };
            Date.now = () => T0 + 15 * MINUTE;
            await UpdatedReview.tick(context);
            assert.deepStrictEqual(Object.fromEntries(query(context.requests[0])), {
                response: 'posted', updatedAt: `${at(-5)}..${at(15)}`, sort: 'updatedAt,ASC', page: '0', size: '100'
            });

            // Unchanged inside the overlap: silent. Changed again: fires again.
            Date.now = () => T0 + 30 * MINUTE;
            await UpdatedReview.tick(context);
            answer = [review(1, { updatedAt: at(44) })];
            Date.now = () => T0 + 45 * MINUTE;
            await UpdatedReview.tick(context);
            assert.deepStrictEqual(context.sent.map(s => s.data.updatedAt), [at(14), at(44)]);
        });

        it('skips a check while the previous one is still running', async function() {
            const context = createContext({ properties: {}, state: { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] } });
            const locks = [];
            context.lock = async (key, options) => {
                locks.push([key, options]);
                throw new Error('locked');
            };
            Date.now = () => T0 + 15 * MINUTE;
            for (const trigger of [NewReview, UpdatedReview, UpdatedGuestProfile, UpdatedReservation]) {
                assert.strictEqual(await trigger.tick(context), false);
            }
            assert.strictEqual(context.requests.length, 0);
            assert.strictEqual(context.state.lastPollAt, T0);
            assert.deepStrictEqual(locks[0], ['revinate-tick-component-1', { ttl: 5 * MINUTE, maxRetryCount: 0 }]);
        });

        it('a Get component fails loudly on an empty answer instead of sending an empty message', async function() {
            for (const [component, content] of [[GetHotel, { hotelId: '1' }], [GetReview, { reviewId: '1' }], [GetReviewsSnapshot, { hotelId: '1' }]]) {
                const context = createContext({ content, responses: [{ data: '' }] });
                await assert.rejects(component.receive(context), /unexpected answer/);
                assert.strictEqual(context.sent.length, 0);
            }
        });

        it('rejects a polling interval outside 1 to 1440 minutes', async function() {
            const context = createContext({ properties: { pollingInterval: 0 }, state: { initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] } });
            await assert.rejects(NewReview.tick(context), /Check Every/);
        });

        it('test() emits the newest matching review, saves no state and throws when there is none', async function() {
            const context = createContext({ properties: { hotelId: '10470', feedback: 'negative' }, responses: [page([review(9)])] });
            await NewReview.test(context);
            const url = new URL(context.requests[0].url);
            assert.strictEqual(url.pathname, '/hotels/10470/reviews');
            assert.deepStrictEqual(Object.fromEntries(url.searchParams), { feedback: 'negative', sort: 'dateCollected,DESC', page: '0', size: '1' });
            assert.strictEqual(context.sent[0].data.id, 9);
            assert.deepStrictEqual(context.state, {});

            const updated = createContext({ properties: {}, responses: [page([review(9)])] });
            await UpdatedReview.test(updated);
            assert.strictEqual(query(updated.requests[0]).get('sort'), 'updatedAt,DESC');

            const empty = createContext({ properties: {}, responses: [page([])] });
            await assert.rejects(NewReview.test(empty), CancelError);
            assert.strictEqual(empty.sent.length, 0);
        });
    });

    describe('Reputation: auth.js', function() {

        const { validate, requestProfileInfo } = porterAuth.definition;

        it('validates with a signed GET /hotels and names the account after the user', async function() {
            const context = createAuthContext(PORTER_AUTH, [page([])]);
            assert.strictEqual(await validate(context), true);
            assert.strictEqual(context.requests[0].url, PORTER + '/hotels?size=1');
            assert.strictEqual(context.requests[0].headers['X-Revinate-Porter-Key'], SAMPLE.apiKey);
            assert.deepStrictEqual(requestProfileInfo(context), { username: SAMPLE.username, apiKey: 'd87b...1234' });
            assert.strictEqual(porterAuth.definition.accountNameFromProfileInfo, 'username');
        });

        it('marks the account invalid on 401 only, and sends nothing when a field is missing', async function() {
            const wrong = createAuthContext(PORTER_AUTH, [httpError(401, { timestamp: Date.now(), message: 'Username does not exist' })]);
            await assert.rejects(validate(wrong), (err) => {
                assert.ok(err instanceof InvalidTokenError);
                assert.match(err.message, /Username does not exist/);
                return true;
            });

            const outage = createAuthContext(PORTER_AUTH, [httpError(503, 'unavailable')]);
            await assert.rejects(validate(outage), (err) => !(err instanceof InvalidTokenError));

            const incomplete = createAuthContext({ ...PORTER_AUTH, apiSecret: '  ' });
            await assert.rejects(validate(incomplete), /API Secret is required/);
            assert.strictEqual(incomplete.requests.length, 0);
        });
    });

    describe('Guest Data: access token', function() {

        it('requests a token with a JSON body from the fixed token URL', async function() {
            const context = createContext({ auth: CDP_AUTH, responses: [tokenResponse('abc')] });
            const token = await cdp.requestToken(context);
            assert.strictEqual(token.token, 'abc');
            assert.strictEqual(token.expiresAt - token.issuedAt, 86400 * 1000);
            assert.deepStrictEqual(context.requests[0], {
                method: 'POST',
                url: CDP + '/oauth/token',
                data: { client_id: 'client-1', client_secret: 'secret-1', audience: 'CDP_API', grant_type: 'client_credentials' }
            });
        });

        it('reuses one token for all requests of an account and never caches it past its expiry', async function() {
            const context = createContext({
                auth: CDP_AUTH,
                responses: [tokenResponse('abc'), cdpPage([]), cdpPage([])]
            });
            await cdp.request(context, { path: '/api/v2/rich-guest-profiles' });
            await cdp.request(context, { path: '/api/v2/reservations' });
            assert.deepStrictEqual(context.requests.map(r => r.method), ['POST', 'GET', 'GET']);
            assert.deepStrictEqual(context.requests[1].headers, { Authorization: 'Bearer abc', 'X-Account-Id': '1928376' });
            assert.strictEqual(context.cacheTtl, 86400 * 1000 - 5 * MINUTE);

            // Another client gets its own token.
            context.auth = { ...CDP_AUTH, clientSecret: 'secret-2' };
            await assert.rejects(cdp.request(context, { path: '/x' }), /no access token/);
            assert.strictEqual(context.requests.filter(r => r.method === 'POST').length, 2);
        });

        it('requests a new token shortly before the cached one expires', async function() {
            const context = createContext({ auth: CDP_AUTH, responses: [tokenResponse('old', 3600), cdpPage([]), tokenResponse('new', 3600), cdpPage([])] });
            const start = 1795392000000;
            Date.now = () => start;
            await cdp.request(context, { path: '/api/v2/reservations' });
            Date.now = () => start + 56 * MINUTE;
            await cdp.request(context, { path: '/api/v2/reservations' });
            assert.deepStrictEqual(context.requests.map(r => r.headers && r.headers.Authorization), [undefined, 'Bearer old', undefined, 'Bearer new']);
        });

        it('replaces a refused cached token once, but only an old one', async function() {
            const start = 1795392000000;
            const denied = httpError(403, { Message: 'User is not authorized to access this resource with an explicit deny in an identity-based policy' });

            // A token that was just issued and is refused: a wrong Account ID. No second token.
            const fresh = createContext({ auth: CDP_AUTH, responses: [tokenResponse('abc'), denied] });
            Date.now = () => start;
            await assert.rejects(cdp.request(fresh, { path: '/api/v2/reservations' }), (err) => {
                assert.ok(err instanceof CancelError);
                assert.match(err.message, /not authorized for this Account ID.*HTTP 403/);
                return true;
            });
            assert.deepStrictEqual(fresh.requests.map(r => r.method), ['POST', 'GET']);

            // A cached token younger than an hour: still no second token, whatever the number of messages.
            Date.now = () => start + 30 * MINUTE;
            fresh.httpRequest = async function(options) {
                this.requests.push(options);
                throw denied;
            };
            await assert.rejects(cdp.request(fresh, { path: '/api/v2/reservations' }), CancelError);
            await assert.rejects(cdp.request(fresh, { path: '/api/v2/reservations' }), CancelError);
            assert.strictEqual(fresh.requests.filter(r => r.method === 'POST').length, 1);

            // A cached token older than an hour: replaced once and the request repeated.
            const old = createContext({ auth: CDP_AUTH, responses: [tokenResponse('old'), cdpPage([]), denied, tokenResponse('new'), cdpPage(['ok'])] });
            Date.now = () => start;
            await cdp.request(old, { path: '/api/v2/reservations' });
            Date.now = () => start + 2 * 60 * MINUTE;
            const body = await cdp.request(old, { path: '/api/v2/reservations' });
            assert.deepStrictEqual(body.data, ['ok']);
            assert.deepStrictEqual(old.requests.map(r => r.headers && r.headers.Authorization), [undefined, 'Bearer old', 'Bearer old', undefined, 'Bearer new']);
        });

        it('explains a refused token request and sends the secret nowhere else', async function() {
            const context = createContext({ auth: CDP_AUTH, responses: [httpError(401, { error: 'access_denied', error_description: 'Unauthorized' })] });
            await assert.rejects(cdp.request(context, { path: '/api/v2/reservations' }), (err) => {
                assert.ok(err instanceof CancelError);
                assert.match(err.message, /Client ID and Client Secret.*HTTP 401: Unauthorized/);
                return true;
            });
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.requests[0].url, CDP + '/oauth/token');
        });

        it('refuses an Account ID that is missing or could not be a header, before any request', async function() {
            for (const accountId of ['', '1928376\r\nX-Evil: 1', 'a b', '../x']) {
                const context = createContext({ auth: { ...CDP_AUTH, accountId } });
                await assert.rejects(cdp.request(context, { path: '/api/v2/reservations' }), CancelError, accountId);
                assert.strictEqual(context.requests.length, 0);
            }
            const override = createContext({ auth: CDP_AUTH, responses: [tokenResponse(), cdpPage([])] });
            await cdp.request(override, { path: '/api/v2/reservations', accountId: ' 555 ' });
            assert.strictEqual(override.requests[1].headers['X-Account-Id'], '555');
        });
    });

    describe('Guest Data: components', function() {

        it('Find Guest Profiles reads the first page with the filters and adds plain e-mail and phone lists', async function() {
            const context = createContext({
                auth: CDP_AUTH,
                content: { emailAddress: ' john.doe@example.com ', modifiedFrom: '2026-11-01T00:00:00.000Z', modifiedTo: '2026-11-20T10:30:00.000Z', outputType: 'array' },
                responses: [tokenResponse(), cdpPage([profile('p1', '2026-11-10T08:00:00.000Z')])]
            });
            await FindGuestProfiles.receive(context);
            const url = new URL(context.requests[1].url);
            assert.strictEqual(url.origin + url.pathname, CDP + '/api/v2/rich-guest-profiles');
            assert.deepStrictEqual(Object.fromEntries(url.searchParams), {
                emailAddress: 'john.doe@example.com',
                lastModifiedAtFrom: '2026-11-01T00:00:00.000Z',
                lastModifiedAtTo: '2026-11-20T10:30:00.000Z',
                pageLimit: '100'
            });
            const [found] = context.sent[0].data.result;
            assert.strictEqual(found.revinate_rich_guest_profile_id, 'p1');
            assert.deepStrictEqual(found.emails, ['p1@example.com']);
            assert.deepStrictEqual(found.phones, ['(702)-234-5566']);
            assert.ok(found.contact_info.email_addresses);
        });

        it('Find Guest Profiles: notFound on an empty page, a loud error on a malformed one, Account ID from the input', async function() {
            const empty = createContext({ auth: CDP_AUTH, content: { accountId: '777' }, responses: [tokenResponse(), cdpPage([])] });
            await FindGuestProfiles.receive(empty);
            assert.deepStrictEqual(empty.sent, [{ data: {}, port: 'notFound' }]);
            assert.strictEqual(empty.requests[1].headers['X-Account-Id'], '777');

            for (const data of [{ meta: {} }, { data: null }, { data: { not: 'a list' } }]) {
                const broken = createContext({ auth: CDP_AUTH, content: {}, responses: [tokenResponse(), { data }] });
                await assert.rejects(FindGuestProfiles.receive(broken), /unexpected answer/);
                assert.strictEqual(broken.sent.length, 0);
            }

            const reversed = createContext({ auth: CDP_AUTH, content: { modifiedFrom: '2026-11-20T00:00:00Z', modifiedTo: '2026-11-01T00:00:00Z' } });
            await assert.rejects(FindGuestProfiles.receive(reversed), /Modified To must not be earlier/);
            assert.strictEqual(reversed.requests.length, 0);
        });

        it('Get Guest Profile uses the singular path, sends sourceSystemId as a header and refuses a path-changing ID', async function() {
            const context = createContext({
                auth: CDP_AUTH,
                content: { profileId: ' 6c31eaa6-d33a-5k8i-a80d-fdy8i2af5cc7 ', sourceSystemId: '0' },
                responses: [tokenResponse('abc'), { data: profile('6c31eaa6-d33a-5k8i-a80d-fdy8i2af5cc7', '2025-02-04T17:18:21.321Z') }]
            });
            await GetGuestProfile.receive(context);
            assert.strictEqual(context.requests[1].url, CDP + '/api/v2/rich-guest-profile/6c31eaa6-d33a-5k8i-a80d-fdy8i2af5cc7');
            assert.deepStrictEqual(context.requests[1].headers, { sourceSystemId: '0', Authorization: 'Bearer abc', 'X-Account-Id': '1928376' });
            assert.deepStrictEqual(context.sent[0].data.emails, ['6c31eaa6-d33a-5k8i-a80d-fdy8i2af5cc7@example.com']);

            for (const profileId of ['abc/../../reservations', 'abc?x=1', 'a b']) {
                const bad = createContext({ auth: CDP_AUTH, content: { profileId } });
                await assert.rejects(GetGuestProfile.receive(bad), CancelError);
                assert.strictEqual(bad.requests.length, 0);
            }
            await assert.rejects(GetGuestProfile.receive(createContext({ auth: CDP_AUTH, content: {} })), /Profile ID is required/);

            const missing = createContext({ auth: CDP_AUTH, content: { profileId: 'abc' }, responses: [tokenResponse(), httpError(404, { message: 'Not Found' })] });
            await assert.rejects(GetGuestProfile.receive(missing), /did not find this record.*HTTP 404: Not Found/);
        });

        it('a profile without contact details gets empty lists', function() {
            assert.deepStrictEqual(cdp.mapProfile({ revinate_rich_guest_profile_id: 'p' }), { revinate_rich_guest_profile_id: 'p', emails: [], phones: [] });
            assert.deepStrictEqual(cdp.mapProfile({ contact_info: { email_addresses: [{}, null, { email_address_reference: {} }] } }).emails, []);
        });

        const reservationData = () => ({
            spa_reservations: [{
                revinate_spa_reservation_id: 'spa-1', revinate_last_modified_at: '2025-02-27T00:39:04.021Z',
                spa_treatments: [{ revinate_spa_treatment_id: 't1', revinate_rich_guest_profile_id: 'p-spa' }]
            }],
            room_reservations: [{
                revinate_room_reservation_id: 'room-1', revinate_last_modified_at: '2025-02-27T02:13:05.144Z',
                room_stays: [
                    { revinate_room_stay_id: 's1', revinate_rich_guest_profile_id: 'p-a' },
                    { revinate_room_stay_id: 's2', revinate_rich_guest_profile_id: 'p-b' },
                    { revinate_room_stay_id: 's3', revinate_rich_guest_profile_id: 'p-a' }
                ]
            }],
            // Nested one level deeper, as in the documentation's sample.
            restaurant_reservations: [[{
                revinate_restaurant_reservation_id: 'rest-1', revinate_last_modified_at: '2025-02-28T04:01:45.856Z',
                revinate_rich_guest_profile_id: 'p-rest'
            }]],
            golf_reservations: [{ revinate_golf_reservation_id: 'golf-1', revinate_last_modified_at: '2025-02-27T02:14:19.012Z', tee_times: [] }],
            something_new: [{ id: 1 }]
        });

        it('flattens the reservations of all types and gives each a type, an ID and its profile IDs', function() {
            const flat = cdp.reservationsOf(reservationData());
            assert.deepStrictEqual(flat.map(r => [r.reservation_type, r.reservation_id, r.rich_guest_profile_ids]), [
                ['room', 'room-1', ['p-a', 'p-b']],
                ['spa', 'spa-1', ['p-spa']],
                ['restaurant', 'rest-1', ['p-rest']],
                ['golf', 'golf-1', []]
            ]);
            assert.strictEqual(flat[0].room_stays.length, 3);
            assert.deepStrictEqual(cdp.reservationsOf({}), []);
            assert.throws(() => cdp.reservationsOf([]), /unexpected answer/);
            assert.throws(() => cdp.reservationsOf('x'), /unexpected answer/);
        });

        it('Find Reservations sends the profiles as repeated profileIds[] and filters the types itself', async function() {
            const context = createContext({
                auth: CDP_AUTH,
                content: { profileIds: 'p-a, p-b', reservationTypes: ['room', 'golf'], outputType: 'array' },
                responses: [tokenResponse(), cdpPage(reservationData())]
            });
            await FindReservations.receive(context);
            assert.strictEqual(context.requests[1].url, CDP + '/api/v2/reservations?profileIds%5B%5D=p-a&profileIds%5B%5D=p-b&pageLimit=100');
            assert.deepStrictEqual(context.sent[0].data.result.map(r => r.reservation_id), ['room-1', 'golf-1']);

            const none = createContext({ auth: CDP_AUTH, content: { reservationTypes: 'golf' }, responses: [tokenResponse(), cdpPage({ room_reservations: [] })] });
            await FindReservations.receive(none);
            assert.strictEqual(none.sent[0].port, 'notFound');
            assert.strictEqual(none.requests[1].url, CDP + '/api/v2/reservations?pageLimit=100');

            const badId = createContext({ auth: CDP_AUTH, content: { profileIds: 'ok,bad/id' } });
            await assert.rejects(FindReservations.receive(badId), CancelError);
            assert.strictEqual(badId.requests.length, 0);

            const badType = createContext({ auth: CDP_AUTH, content: { reservationTypes: ['boat'] }, responses: [tokenResponse(), cdpPage({})] });
            await assert.rejects(FindReservations.receive(badType), /unknown type/);
        });

        it('Make API Call adds the token, pins the origin, and lets only X-Account-Id be chosen', async function() {
            const context = createContext({
                auth: CDP_AUTH,
                content: {
                    url: '/api/v2/reservations', method: 'GET', parameters: '{"pageLimit":"5"}',
                    headers: '{"authorization":"Bearer stolen","x-account-id":"555","Accept":"application/json"}'
                },
                responses: [tokenResponse('abc'), { status: 200, headers: {}, data: { data: {} } }]
            });
            await CdpMakeApiCall.receive(context);
            const request = context.requests[1];
            assert.strictEqual(request.url, CDP + '/api/v2/reservations');
            assert.deepStrictEqual(request.params, { pageLimit: '5' });
            assert.deepStrictEqual(request.headers, { Accept: 'application/json', Authorization: 'Bearer abc', 'X-Account-Id': '555' });
            assert.strictEqual(context.sent[0].data.statusCode, 200);

            for (const url of ['https://evil.example/api/v2/reservations', '//evil.example/x', 'https://porter.revinate.com/hotels']) {
                const foreign = createContext({ auth: CDP_AUTH, content: { url, method: 'GET' } });
                await assert.rejects(CdpMakeApiCall.receive(foreign), CancelError);
                assert.strictEqual(foreign.requests.length, 0);
            }

            const injected = createContext({ auth: CDP_AUTH, content: { url: '/api/v2/reservations', method: 'GET', headers: '{"X-Account-Id":"1\\r\\nX-Evil: 1"}' } });
            await assert.rejects(CdpMakeApiCall.receive(injected), CancelError);
            assert.strictEqual(injected.requests.length, 0);
        });
    });

    describe('Guest Data: triggers', function() {

        const T0 = 1795392000000;
        const iso = (minutes) => new Date(T0 + minutes * MINUTE).toISOString();
        const started = () => ({ initialized: true, lastTimestamp: T0, lastPollAt: T0, known: [] });

        it('New or Updated Guest Profile: baseline, then profiles modified afterwards, again when modified again', async function() {
            const context = createContext({ auth: CDP_AUTH, properties: { pollingInterval: 15 } });
            Date.now = () => T0;
            await UpdatedGuestProfile.tick(context);
            assert.strictEqual(context.requests.length, 0);
            assert.strictEqual(context.state.initialized, true);

            let answer = [profile('p1', iso(14))];
            context.httpRequest = async function(options) {
                this.requests.push(options);
                return options.method === 'POST' ? { status: 200, ...tokenResponse() } : { status: 200, headers: {}, ...cdpPage(answer) };
            };
            Date.now = () => T0 + 15 * MINUTE;
            await UpdatedGuestProfile.tick(context);
            const url = new URL(context.requests[1].url);
            assert.strictEqual(url.pathname, '/api/v2/rich-guest-profiles');
            assert.deepStrictEqual(Object.fromEntries(url.searchParams), {
                lastModifiedAtFrom: iso(-5), lastModifiedAtTo: iso(15), pageLimit: '100'
            });
            assert.deepStrictEqual(context.sent.map(s => s.data.revinate_rich_guest_profile_id), ['p1']);
            assert.deepStrictEqual(context.sent[0].data.emails, ['p1@example.com']);

            Date.now = () => T0 + 30 * MINUTE;
            await UpdatedGuestProfile.tick(context);
            assert.strictEqual(context.sent.length, 1);

            answer = [profile('p1', iso(44))];
            Date.now = () => T0 + 45 * MINUTE;
            await UpdatedGuestProfile.tick(context);
            assert.deepStrictEqual(context.sent.map(s => s.data.revinate_last_modified_at), [iso(14), iso(44)]);
        });

        it('pages from the number the API gives its first page, whether it counts from 1 or from 0', async function() {
            for (const first of [1, 0]) {
                const context = createContext({ auth: CDP_AUTH, properties: {}, state: started() });
                const asked = [];
                context.httpRequest = async function(options) {
                    if (options.method === 'POST') {
                        return { status: 200, ...tokenResponse() };
                    }
                    const pageNumber = query(options).get('pageNumber');
                    asked.push(pageNumber);
                    const index = pageNumber === null ? 0 : Number(pageNumber) - first;
                    return { status: 200, headers: {}, ...cdpPage([profile(`p${index}`, iso(1 + index))], { number: first + index, totalPages: 3 }) };
                };
                Date.now = () => T0 + 15 * MINUTE;
                await UpdatedGuestProfile.tick(context);
                assert.deepStrictEqual(asked, [null, String(first + 1), String(first + 2)]);
                assert.deepStrictEqual(context.sent.map(s => s.data.revinate_rich_guest_profile_id), ['p0', 'p1', 'p2']);
            }
        });

        it('New or Updated Reservation: reads every type, fires only the chosen ones and remembers them all', async function() {
            const context = createContext({ auth: CDP_AUTH, properties: { reservationTypes: ['spa'], accountId: '777' }, state: started() });
            context.httpRequest = async function(options) {
                this.requests.push(options);
                if (options.method === 'POST') {
                    return { status: 200, ...tokenResponse() };
                }
                return {
                    status: 200, headers: {}, ...cdpPage({
                        room_reservations: [{ revinate_room_reservation_id: 'room-1', revinate_last_modified_at: iso(13), room_stays: [] }],
                        spa_reservations: [{ revinate_spa_reservation_id: 'spa-1', revinate_last_modified_at: iso(14), spa_treatments: [] }]
                    })
                };
            };
            Date.now = () => T0 + 15 * MINUTE;
            await UpdatedReservation.tick(context);
            assert.strictEqual(context.requests[1].headers['X-Account-Id'], '777');
            assert.strictEqual(new URL(context.requests[1].url).pathname, '/api/v2/reservations');
            assert.deepStrictEqual(context.sent.map(s => [s.data.reservation_type, s.data.reservation_id]), [['spa', 'spa-1']]);
            assert.deepStrictEqual(context.state.known.map(([key]) => key).sort(), [`room:room-1@${iso(13)}`, `spa:spa-1@${iso(14)}`]);

            Date.now = () => T0 + 30 * MINUTE;
            await UpdatedReservation.tick(context);
            assert.strictEqual(context.sent.length, 1);
        });

        it('a failed or malformed check keeps the state', async function() {
            const context = createContext({ auth: CDP_AUTH, properties: {}, state: started(), responses: [tokenResponse(), { data: { message: 'Internal server error' } }] });
            Date.now = () => T0 + 15 * MINUTE;
            await assert.rejects(UpdatedGuestProfile.tick(context), /unexpected answer/);
            assert.deepStrictEqual(context.state, started());
        });

        it('test() emits one existing record without saving state and throws when there is none', async function() {
            const profiles = createContext({ auth: CDP_AUTH, properties: {}, responses: [tokenResponse(), cdpPage([profile('p1', iso(0))])] });
            await UpdatedGuestProfile.test(profiles);
            assert.strictEqual(profiles.sent[0].data.revinate_rich_guest_profile_id, 'p1');
            assert.deepStrictEqual(profiles.state, {});

            const reservations = createContext({
                auth: CDP_AUTH, properties: { reservationTypes: ['golf'] },
                responses: [tokenResponse(), cdpPage({
                    room_reservations: [{ revinate_room_reservation_id: 'room-1' }],
                    golf_reservations: [{ revinate_golf_reservation_id: 'golf-1' }]
                })]
            });
            await UpdatedReservation.test(reservations);
            assert.strictEqual(reservations.sent[0].data.reservation_id, 'golf-1');

            const empty = createContext({ auth: CDP_AUTH, properties: {}, responses: [tokenResponse(), cdpPage([])] });
            await assert.rejects(UpdatedGuestProfile.test(empty), CancelError);
            const none = createContext({ auth: CDP_AUTH, properties: {}, responses: [tokenResponse(), cdpPage({})] });
            await assert.rejects(UpdatedReservation.test(none), CancelError);
        });
    });

    describe('Guest Data: auth.js', function() {

        const { validate, requestProfileInfo } = cdpAuth.definition;

        it('validates in two steps without a cache: the token, then one read with the Account ID', async function() {
            const context = createAuthContext(CDP_AUTH, [tokenResponse('abc'), cdpPage([])]);
            assert.strictEqual(await validate(context), true);
            assert.strictEqual(context.requests[0].url, CDP + '/oauth/token');
            assert.strictEqual(context.requests[1].url, CDP + '/api/v2/rich-guest-profiles');
            assert.deepStrictEqual(context.requests[1].headers, { Authorization: 'Bearer abc', 'X-Account-Id': '1928376' });
            assert.deepStrictEqual(requestProfileInfo(context), { accountName: 'Revinate account 1928376', accountId: '1928376' });
        });

        it('tells wrong client credentials from a wrong Account ID, and an outage from both', async function() {
            const wrongClient = createAuthContext(CDP_AUTH, [httpError(401, { error: 'access_denied', error_description: 'Unauthorized' })]);
            await assert.rejects(validate(wrongClient), (err) => {
                assert.ok(err instanceof InvalidTokenError);
                assert.match(err.message, /Client ID and Client Secret/);
                return true;
            });
            assert.strictEqual(wrongClient.requests.length, 1);

            const wrongAccount = createAuthContext(CDP_AUTH, [tokenResponse(), httpError(403, { Message: 'User is not authorized' })]);
            await assert.rejects(validate(wrongAccount), (err) => {
                assert.ok(err instanceof InvalidTokenError);
                assert.match(err.message, /denied access to Account ID 1928376/);
                return true;
            });

            const outage = createAuthContext(CDP_AUTH, [httpError(502, 'bad gateway')]);
            await assert.rejects(validate(outage), (err) => !(err instanceof InvalidTokenError));

            const network = createAuthContext(CDP_AUTH, [Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' })]);
            await assert.rejects(validate(network), (err) => !(err instanceof InvalidTokenError) && /ENOTFOUND/.test(err.message));
        });

        it('sends nothing when a field is missing or the Account ID could not be a header', async function() {
            for (const fields of [{ ...CDP_AUTH, clientSecret: '' }, { ...CDP_AUTH, accountId: ' ' }, { ...CDP_AUTH, accountId: '1\r\nX-Evil: 1' }]) {
                const context = createAuthContext(fields);
                await assert.rejects(validate(context), InvalidTokenError);
                assert.strictEqual(context.requests.length, 0);
            }
        });
    });
});
