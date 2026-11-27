'use strict';

/* eslint-disable max-len */

const assert = require('assert');

const lib = require('../../lib');
const auth = require('../../auth');
const FindSmartlocks = require('../../core/FindSmartlocks/FindSmartlocks');
const LockSmartlock = require('../../core/LockSmartlock/LockSmartlock');
const RunSmartlockAction = require('../../core/RunSmartlockAction/RunSmartlockAction');
const CreateKeypadCode = require('../../core/CreateKeypadCode/CreateKeypadCode');
const CreateAppInvite = require('../../core/CreateAppInvite/CreateAppInvite');
const FindSmartlockAuthorizations = require('../../core/FindSmartlockAuthorizations/FindSmartlockAuthorizations');
const UpdateSmartlockAuthorization = require('../../core/UpdateSmartlockAuthorization/UpdateSmartlockAuthorization');
const DeleteSmartlockAuthorization = require('../../core/DeleteSmartlockAuthorization/DeleteSmartlockAuthorization');
const FindLogEntries = require('../../core/FindLogEntries/FindLogEntries');
const CreateAccountUser = require('../../core/CreateAccountUser/CreateAccountUser');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const NewLogEntry = require('../../core/NewLogEntry/NewLogEntry');
const SmartlockStateChanged = require('../../core/SmartlockStateChanged/SmartlockStateChanged');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

const API = 'https://api.nuki.io';
const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const LOCK_ID = '21913877581';
const AUTH_ID = '68b1422f9c3a4e17a584f104';

// A response of an Error makes httpRequest reject with it. A function is called with the request.
const createContext = ({ content = {}, properties = {}, state = {}, responses = [], timeout } = {}) => {

    const context = {
        auth: { apiKey: 'token-1' },
        config: {},
        properties,
        state: { ...state },
        componentId: 'component-1',
        flowId: 'flow-1',
        messages: timeout ? { timeout: { content: timeout } } : { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        timeouts: [],
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
        async setTimeout(data, ms) {
            this.timeouts.push({ data, ms });
        },
        async log() {},
        async lock() {
            return { async unlock() {} };
        },
        staticCache: {
            get: async key => context.cache[key],
            set: async (key, value) => {
                context.cache[key] = value;
            }
        },
        async saveState(newState) {
            this.state = { ...newState };
        }
    };
    return context;
};

const httpError = (status, data) => Object.assign(new Error('Request failed with status code ' + status), {
    response: { status, data, headers: {} }
});

const onlineLock = (overrides = {}) => ({
    smartlockId: Number(LOCK_ID),
    name: 'Front Door',
    serverState: 0,
    state: { state: 1, doorState: 2, batteryCritical: false },
    config: { keypadPaired: true, keypad2Paired: false },
    ...overrides
});

const keypadAuth = (id, name, code, extra = {}) => ({
    id, smartlockId: Number(LOCK_ID), type: 13, name, code, enabled: true, remoteAllowed: false, lockCount: 0, ...extra
});

const logEntry = (id, date, extra = {}) => ({
    id, smartlockId: Number(LOCK_ID), deviceType: 4, name: 'Guest', action: 1, trigger: 255, state: 0,
    autoUnlock: false, date, ...extra
});

describe('Nuki', function() {

    let realSleep;

    beforeEach(function() {
        realSleep = lib.sleep;
        lib.sleep = async () => {};
    });

    afterEach(function() {
        lib.sleep = realSleep;
    });

    describe('lib', function() {

        it('sends the API token as a Bearer token, from a component and from auth.js', function() {
            assert.deepStrictEqual(lib.authHeaders({ auth: { apiKey: ' abc ' } }), { Authorization: 'Bearer abc' });
            assert.deepStrictEqual(lib.authHeaders({ apiKey: 'abc' }), { Authorization: 'Bearer abc' });
        });

        it('always calls the Nuki API origin', async function() {
            const context = createContext({ responses: [{ data: [] }] });
            await lib.request(context, { path: '/smartlock' });
            assert.strictEqual(context.requests[0].url, API + '/smartlock');
            assert.strictEqual(context.requests[0].headers.Authorization, 'Bearer token-1');
        });

        it('refuses IDs that could change the path of a request', function() {
            const context = createContext();
            assert.strictEqual(lib.requireNumericId(context, ' 21913877581 ', 'Smartlock'), '21913877581');
            assert.strictEqual(lib.requireNumericId(context, 21913877581, 'Smartlock'), '21913877581');
            assert.throws(() => lib.requireNumericId(context, '1/../../account', 'Smartlock'), CancelError);
            assert.throws(() => lib.requireNumericId(context, '12?x=1', 'Smartlock'), CancelError);
            assert.throws(() => lib.requireNumericId(context, ' ', 'Smartlock'), /Smartlock is required/);
            assert.strictEqual(lib.requireHexId(context, AUTH_ID, 'Authorization ID'), AUTH_ID);
            assert.throws(() => lib.requireHexId(context, 'abc/../x', 'Authorization ID'), CancelError);
            assert.throws(() => lib.requireHexId(context, '', 'Authorization ID'), /Authorization ID is required/);
        });

        it('retries a 429 answer and returns the next one', async function() {
            const context = createContext({ responses: [httpError(429, {}), { data: [{ smartlockId: 1 }] }] });
            const body = await lib.request(context, { path: '/smartlock' });
            assert.deepStrictEqual(body, [{ smartlockId: 1 }]);
            assert.strictEqual(context.requests.length, 2);
        });

        it('gives up on 429 after two retries with an error the engine can retry', async function() {
            const context = createContext({ responses: [httpError(429, {}), httpError(429, {}), httpError(429, {})] });
            await assert.rejects(lib.request(context, { path: '/smartlock' }), err => {
                assert.ok(!(err instanceof CancelError));
                assert.match(err.message, /rate limit/);
                return true;
            });
            assert.strictEqual(context.requests.length, 3);
        });

        it('turns a 401 into a CancelError with Nuki\'s detailMessage', async function() {
            const context = createContext({
                responses: [httpError(401, { detailMessage: 'Your access token is not authorized: Subject not found.' })]
            });
            await assert.rejects(lib.request(context, { path: '/smartlock' }), err => {
                assert.ok(err instanceof CancelError);
                assert.match(err.message, /HTTP 401: Your access token is not authorized: Subject not found\./);
                assert.match(err.message, /scope/);
                return true;
            });
            assert.strictEqual(context.requests.length, 1);
        });

        it('keeps 423 and 5xx retryable', async function() {
            for (const status of [423, 500, 503]) {
                const context = createContext({ responses: [httpError(status, {})] });
                await assert.rejects(lib.request(context, { path: '/smartlock' }), err => !(err instanceof CancelError));
            }
        });

        it('checks keypad codes against Nuki\'s rules', function() {
            const context = createContext();
            assert.strictEqual(lib.requireKeypadCode(context, '352961'), 352961);
            assert.strictEqual(lib.requireKeypadCode(context, 352961), 352961);
            for (const bad of ['35296', '3529611', '350961', '123456', 'abcdef', '', null]) {
                assert.throws(() => lib.requireKeypadCode(context, bad), CancelError, String(bad));
            }
        });

        it('generates keypad codes that follow the rules', function() {
            const context = createContext();
            for (let i = 0; i < 500; i++) {
                const code = lib.generateKeypadCode();
                assert.strictEqual(lib.requireKeypadCode(context, code), code);
            }
        });

        it('builds the weekday bitmask', function() {
            const context = createContext();
            assert.strictEqual(lib.toWeekdayMask(context, ['monday', 'thursday']), 72);
            assert.strictEqual(lib.toWeekdayMask(context, 'monday,tuesday,wednesday,thursday,friday'), 124);
            assert.strictEqual(lib.toWeekdayMask(context, WEEK), 127);
            assert.strictEqual(lib.toWeekdayMask(context, []), undefined);
            assert.strictEqual(lib.toWeekdayMask(context, undefined), undefined);
            assert.throws(() => lib.toWeekdayMask(context, ['funday']), CancelError);
        });

        it('converts a time of day to minutes from midnight', function() {
            const context = createContext();
            assert.strictEqual(lib.toMinutesFromMidnight(context, '09:00', 'From'), 540);
            assert.strictEqual(lib.toMinutesFromMidnight(context, '17:00', 'Until'), 1020);
            assert.strictEqual(lib.toMinutesFromMidnight(context, 540, 'From'), 540);
            assert.strictEqual(lib.toMinutesFromMidnight(context, '0', 'From'), 0);
            assert.strictEqual(lib.toMinutesFromMidnight(context, '', 'From'), undefined);
            for (const bad of ['25:00', '09:60', '9am', '1441', '-5']) {
                assert.throws(() => lib.toMinutesFromMidnight(context, bad, 'From'), CancelError, bad);
            }
        });

        it('sends dates in UTC with milliseconds and rejects an inverted window', function() {
            const context = createContext();
            assert.deepStrictEqual(
                lib.buildAccessWindow(context, {
                    allowedFromDate: '2026-12-12T15:00:00+01:00',
                    allowedUntilDate: '2026-12-15T10:00:00Z'
                }),
                { allowedFromDate: '2026-12-12T14:00:00.000Z', allowedUntilDate: '2026-12-15T10:00:00.000Z' }
            );
            assert.deepStrictEqual(lib.buildAccessWindow(context, {}), {});
            assert.throws(() => lib.buildAccessWindow(context, {
                allowedFromDate: '2026-12-15T10:00:00Z', allowedUntilDate: '2026-12-12T10:00:00Z'
            }), /Allowed Until must be later/);
            assert.throws(() => lib.buildAccessWindow(context, { allowedFromDate: 'next week' }), /not a valid date/);
        });
    });

    describe('MakeApiCall', function() {

        it('pins the origin', function() {
            const context = createContext();
            assert.strictEqual(lib.resolveApiUrl(context, '/smartlock'), API + '/smartlock');
            assert.strictEqual(lib.resolveApiUrl(context, 'smartlock/1/auth'), API + '/smartlock/1/auth');
            assert.strictEqual(lib.resolveApiUrl(context, API + '/account'), API + '/account');
            const foreign = [
                'https://evil.example/smartlock',
                '//evil.example/smartlock',
                'https://api.nuki.io.evil.example/x',
                'https://api.nuki.io@evil.example/x',
                'http://api.nuki.io/smartlock',
                'https://user:pass@api.nuki.io/smartlock',
                '\\\\evil.example\\x',
                '/\\evil.example/x',
                ' https://evil.example/x'
            ];
            for (const url of foreign) {
                assert.throws(() => lib.resolveApiUrl(context, url), CancelError, url);
            }
        });

        it('makes no request to a foreign host', async function() {
            const context = createContext({ content: { url: 'https://evil.example/steal', method: 'GET' } });
            await assert.rejects(MakeApiCall.receive(context), CancelError);
            assert.strictEqual(context.requests.length, 0);
        });

        it('sends headers and parameters stored as a JSON object string, and never a foreign Authorization', async function() {
            const context = createContext({
                content: {
                    url: '/smartlock/1/auth',
                    method: 'GET',
                    headers: '{"Accept":"application/json","authorization":"Bearer other"}',
                    parameters: '{"types":"13"}'
                },
                responses: [{ status: 200, data: [], headers: { 'content-type': 'application/json' } }]
            });
            await MakeApiCall.receive(context);
            const request = context.requests[0];
            assert.strictEqual(request.url, API + '/smartlock/1/auth');
            assert.deepStrictEqual(request.headers, { Accept: 'application/json', Authorization: 'Bearer token-1' });
            assert.deepStrictEqual(request.params, { types: '13' });
            assert.deepStrictEqual(context.sent[0].data.body, []);
        });

        it('rejects a body that is not JSON', async function() {
            const context = createContext({ content: { url: '/smartlock', method: 'POST', body: '{nope' } });
            await assert.rejects(MakeApiCall.receive(context), /Request Body must be valid JSON/);
            assert.strictEqual(context.requests.length, 0);
        });
    });

    describe('auth', function() {

        it('validates with GET /smartlock and explains a 401', async function() {
            const ok = createContext({ responses: [{ data: [] }] });
            ok.apiKey = 'token-1';
            delete ok.auth;
            assert.strictEqual(await auth.definition.validate(ok), true);
            assert.strictEqual(ok.requests[0].url, API + '/smartlock');
            assert.strictEqual(ok.requests[0].headers.Authorization, 'Bearer token-1');

            const bad = createContext({ responses: [httpError(401, { detailMessage: 'nope' })] });
            bad.apiKey = 'x';
            delete bad.auth;
            await assert.rejects(auth.definition.validate(bad), /did not accept the API token/);
        });

        it('does not report an outage as a bad token', async function() {
            const context = createContext({ responses: [httpError(503, {})] });
            context.apiKey = 'x';
            delete context.auth;
            await assert.rejects(auth.definition.validate(context), err => !/did not accept the API token/.test(err.message));
        });

        it('labels the account with the masked token when the token has no account scope', async function() {
            const context = createContext({ responses: [httpError(401, {})] });
            context.apiKey = 'abcd1234efgh5678ijkl';
            delete context.auth;
            const profile = await auth.definition.requestProfileInfo(context);
            assert.deepStrictEqual(profile, { accountName: 'abcd...ijkl' });
        });

        it('labels the account with its e-mail when the token can read it', async function() {
            const context = createContext({ responses: [{ data: { accountId: 5, name: 'Hotel', email: 'h@example.com' } }] });
            context.apiKey = 'abcd1234efgh5678ijkl';
            delete context.auth;
            const profile = await auth.definition.requestProfileInfo(context);
            assert.strictEqual(profile.accountName, 'h@example.com');
        });
    });

    describe('FindSmartlocks', function() {

        it('filters by type on the API and by name locally', async function() {
            const context = createContext({
                content: { type: '4', name: 'front', outputType: 'array' },
                responses: [{ data: [onlineLock(), onlineLock({ smartlockId: 2, name: 'Garage' })] }]
            });
            await FindSmartlocks.receive(context);
            assert.deepStrictEqual(context.requests[0].params, { type: 4 });
            assert.strictEqual(context.sent[0].port, 'out');
            assert.strictEqual(context.sent[0].data.count, 1);
            assert.strictEqual(context.sent[0].data.result[0].name, 'Front Door');
        });

        it('sends notFound for an empty account', async function() {
            const context = createContext({ content: { outputType: 'first' }, responses: [{ data: [] }] });
            await FindSmartlocks.receive(context);
            assert.deepStrictEqual(context.sent, [{ data: {}, port: 'notFound' }]);
        });

        it('as a dropdown source: caches, and shows an empty dropdown on an error', async function() {
            const context = createContext({ properties: { isSource: true }, responses: [{ data: [onlineLock()] }] });
            await FindSmartlocks.receive(context);
            await FindSmartlocks.receive(context);
            assert.strictEqual(context.requests.length, 1);
            assert.deepStrictEqual(FindSmartlocks.toSelectArray(context.sent[1].data), [
                { label: 'Front Door (21913877581)', value: LOCK_ID }
            ]);

            const failing = createContext({ properties: { isSource: true }, responses: [httpError(401, {})] });
            await FindSmartlocks.receive(failing);
            assert.deepStrictEqual(failing.sent, [{ data: { result: [] }, port: 'out' }]);
        });

        it('lets an error reach the flow when it is not a source call', async function() {
            const context = createContext({ content: {}, responses: [httpError(401, {})] });
            await assert.rejects(FindSmartlocks.receive(context), CancelError);
        });
    });

    describe('device actions', function() {

        it('Lock: checks the device, posts the action, reports the state before', async function() {
            const context = createContext({ content: { smartlockId: LOCK_ID }, responses: [{ data: onlineLock() }, { status: 204 }] });
            await LockSmartlock.receive(context);
            assert.strictEqual(context.requests[0].url, `${API}/smartlock/${LOCK_ID}`);
            assert.strictEqual(context.requests[1].method, 'POST');
            assert.strictEqual(context.requests[1].url, `${API}/smartlock/${LOCK_ID}/action/lock`);
            assert.strictEqual(context.requests[1].data, undefined);
            assert.deepStrictEqual(context.sent[0], {
                data: { smartlockId: Number(LOCK_ID), name: 'Front Door', previousLockState: 1, previousDoorState: 2 },
                port: 'out'
            });
        });

        it('sends nothing to an offline device', async function() {
            const context = createContext({ content: { smartlockId: LOCK_ID }, responses: [{ data: onlineLock({ serverState: 4 }) }] });
            await assert.rejects(LockSmartlock.receive(context), /is offline/);
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.sent.length, 0);
        });

        it('does not report success when the action is refused', async function() {
            const context = createContext({
                content: { smartlockId: LOCK_ID, action: '3' },
                responses: [{ data: onlineLock() }, httpError(400, { detailMessage: 'not supported' })]
            });
            await assert.rejects(RunSmartlockAction.receive(context), CancelError);
            assert.strictEqual(context.sent.length, 0);
        });

        it('RunSmartlockAction sends action and option as integers', async function() {
            const context = createContext({
                content: { smartlockId: LOCK_ID, action: '2', option: '4' },
                responses: [{ data: onlineLock() }, { status: 204 }]
            });
            await RunSmartlockAction.receive(context);
            assert.deepStrictEqual(context.requests[1].data, { action: 2, option: 4 });

            const bad = createContext({ content: { smartlockId: LOCK_ID, action: '9' } });
            await assert.rejects(RunSmartlockAction.receive(bad), /from 1 to 7/);
            assert.strictEqual(bad.requests.length, 0);
        });
    });

    describe('CreateKeypadCode', function() {

        const input = {
            smartlockId: LOCK_ID,
            name: 'Reservation 48213',
            code: '352961',
            allowedFromDate: '2026-12-12T14:00:00Z',
            allowedUntilDate: '2026-12-15T10:00:00Z'
        };

        it('creates the code and returns the authorization found afterwards', async function() {
            const created = keypadAuth(AUTH_ID, 'Reservation 48213', 352961);
            const context = createContext({
                content: input,
                responses: [
                    { data: onlineLock() },
                    { data: [keypadAuth('aaaaaaaaaaaaaaaaaaaaaaaa', 'Reservation 48213', 999999)] },
                    { status: 204, data: '' },
                    { data: [keypadAuth('aaaaaaaaaaaaaaaaaaaaaaaa', 'Reservation 48213', 999999), created] }
                ]
            });
            await CreateKeypadCode.receive(context);

            const put = context.requests[2];
            assert.strictEqual(put.method, 'PUT');
            assert.strictEqual(put.url, `${API}/smartlock/${LOCK_ID}/auth`);
            assert.deepStrictEqual(put.data, {
                name: 'Reservation 48213',
                type: 13,
                remoteAllowed: false,
                allowedFromDate: '2026-12-12T14:00:00.000Z',
                allowedUntilDate: '2026-12-15T10:00:00.000Z',
                code: 352961
            });
            assert.deepStrictEqual(context.requests[1].params, { types: '13' });
            assert.deepStrictEqual(context.sent, [{ data: created, port: 'out' }]);
            assert.strictEqual(context.timeouts.length, 0);
        });

        it('does not mistake an older authorization with the same name and code for the new one', function() {
            const old = keypadAuth('aaaaaaaaaaaaaaaaaaaaaaaa', 'Guest', 352961);
            const found = lib.matchCreatedAuthorization([old], {
                type: 13, name: 'Guest', code: 352961, knownIds: ['aaaaaaaaaaaaaaaaaaaaaaaa']
            });
            assert.strictEqual(found, undefined);
        });

        it('generates a code that is free on the device when none is given', async function() {
            const context = createContext({
                content: { smartlockId: LOCK_ID, name: 'Guest' },
                responses: [{ data: onlineLock() }, { data: [] }, { status: 204 }, { data: [] }, { data: [] }]
            });
            await CreateKeypadCode.receive(context);
            const { code } = context.requests[2].data;
            assert.strictEqual(lib.requireKeypadCode(context, code), code);
            // Not found within the quick lookups: the lookup continues later with the generated code.
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.timeouts.length, 1);
            assert.strictEqual(context.timeouts[0].ms, 60000);
            assert.strictEqual(context.timeouts[0].data.lookup.code, code);
        });

        it('refuses a code already used on the device before writing', async function() {
            const context = createContext({
                content: input,
                responses: [{ data: onlineLock() }, { data: [keypadAuth('aaaaaaaaaaaaaaaaaaaaaaaa', 'Other', 352961)] }]
            });
            await assert.rejects(CreateKeypadCode.receive(context), /already used/);
            assert.ok(context.requests.every(request => request.method !== 'PUT'));
        });

        it('refuses a device without a Keypad and an offline device before writing', async function() {
            const noKeypad = createContext({
                content: input,
                responses: [{ data: onlineLock({ config: { keypadPaired: false, keypad2Paired: false } }) }]
            });
            await assert.rejects(CreateKeypadCode.receive(noKeypad), /No Keypad is paired/);
            assert.strictEqual(noKeypad.requests.length, 1);

            const offline = createContext({ content: input, responses: [{ data: onlineLock({ serverState: 4 }) }] });
            await assert.rejects(CreateKeypadCode.receive(offline), /is offline/);
            assert.strictEqual(offline.requests.length, 1);
        });

        it('validates the input before any request', async function() {
            for (const content of [
                { ...input, code: '123456' },
                { ...input, code: '35096' },
                { ...input, name: 'x'.repeat(33) },
                { ...input, smartlockId: 'abc' },
                { ...input, allowedUntilDate: '2026-12-01T00:00:00Z' }
            ]) {
                const context = createContext({ content });
                await assert.rejects(CreateKeypadCode.receive(context), CancelError);
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('does not send a second create request when the lookup fails', async function() {
            const context = createContext({
                content: input,
                responses: [{ data: onlineLock() }, { data: [] }, { status: 204 }, httpError(500, {})]
            });
            await CreateKeypadCode.receive(context);
            assert.strictEqual(context.requests.filter(request => request.method === 'PUT').length, 1);
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.timeouts.length, 1);
        });

        it('fails without output when Nuki refuses the create request', async function() {
            const context = createContext({
                content: input,
                responses: [{ data: onlineLock() }, { data: [] }, httpError(402, { detailMessage: 'No active Smart Hosting subscription' })]
            });
            await assert.rejects(CreateKeypadCode.receive(context), err => {
                assert.ok(err instanceof CancelError);
                assert.match(err.message, /No active Smart Hosting subscription/);
                return true;
            });
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.timeouts.length, 0);
        });

        it('continuation: finds the authorization later', async function() {
            const created = keypadAuth(AUTH_ID, 'Guest', 352961);
            const lookup = { smartlockId: LOCK_ID, type: 13, name: 'Guest', code: 352961, knownIds: [], deadline: Date.now() + 60000 };
            const context = createContext({ timeout: { lookup }, responses: [{ data: [created] }] });
            await CreateKeypadCode.receive(context);
            assert.deepStrictEqual(context.sent, [{ data: created, port: 'out' }]);
            assert.ok(context.requests.every(request => request.method === 'GET'));
        });

        it('continuation: keeps waiting before the deadline, reports notConfirmed after it', async function() {
            const lookup = { smartlockId: LOCK_ID, type: 13, name: 'Guest', code: 352961, knownIds: [], deadline: Date.now() + 60000 };
            const waiting = createContext({ timeout: { lookup }, responses: [{ data: [] }] });
            await CreateKeypadCode.receive(waiting);
            assert.strictEqual(waiting.sent.length, 0);
            assert.deepStrictEqual(waiting.timeouts, [{ data: { lookup }, ms: 60000 }]);

            const late = createContext({ timeout: { lookup: { ...lookup, deadline: Date.now() - 1 } }, responses: [{ data: [] }] });
            await CreateKeypadCode.receive(late);
            assert.deepStrictEqual(late.sent, [{
                data: { smartlockId: Number(LOCK_ID), type: 13, name: 'Guest', code: 352961, waitedMinutes: 5 },
                port: 'notConfirmed'
            }]);
            assert.strictEqual(late.timeouts.length, 0);
        });

        it('continuation: a failed read throws a retryable error and never writes', async function() {
            const lookup = { smartlockId: LOCK_ID, type: 13, name: 'Guest', code: 352961, knownIds: [], deadline: Date.now() + 60000 };
            const context = createContext({ timeout: { lookup }, responses: [httpError(503, {})] });
            await assert.rejects(CreateKeypadCode.receive(context), err => !(err instanceof CancelError));
            assert.strictEqual(context.sent.length, 0);
            assert.ok(context.requests.every(request => request.method === 'GET'));
        });
    });

    describe('CreateAppInvite', function() {

        it('creates an app authorization for the account user and finds it by name and user', async function() {
            const created = { id: AUTH_ID, smartlockId: Number(LOCK_ID), type: 0, name: 'Guest', accountUserId: 77 };
            const context = createContext({
                content: { smartlockId: LOCK_ID, accountUserId: '77', name: 'Guest', remoteAllowed: false },
                responses: [
                    { data: onlineLock() },
                    { data: [] },
                    { status: 204 },
                    { data: [{ ...created, id: 'bbbbbbbbbbbbbbbbbbbbbbbb', accountUserId: 78 }, created] }
                ]
            });
            await CreateAppInvite.receive(context);
            assert.deepStrictEqual(context.requests[2].data, { name: 'Guest', type: 0, accountUserId: 77, remoteAllowed: false });
            assert.deepStrictEqual(context.requests[1].params, { types: '0' });
            assert.deepStrictEqual(context.sent, [{ data: created, port: 'out' }]);
        });

        it('requires the account user', async function() {
            const context = createContext({ content: { smartlockId: LOCK_ID, name: 'Guest' } });
            await assert.rejects(CreateAppInvite.receive(context), /Account User is required/);
            assert.strictEqual(context.requests.length, 0);
        });
    });

    describe('authorizations', function() {

        it('Find: filters by type on the API, by name and user locally, and sends notFound when empty', async function() {
            const context = createContext({
                content: { smartlockId: LOCK_ID, types: ['13', '0'], name: '48213', outputType: 'array' },
                responses: [{ data: [keypadAuth(AUTH_ID, 'Reservation 48213', 352961), keypadAuth('b', 'Other', 1)] }]
            });
            await FindSmartlockAuthorizations.receive(context);
            assert.deepStrictEqual(context.requests[0].params, { types: '13,0' });
            assert.strictEqual(context.sent[0].data.count, 1);

            const empty = createContext({ content: { smartlockId: LOCK_ID, types: '13' }, responses: [{ data: [] }] });
            await FindSmartlockAuthorizations.receive(empty);
            assert.deepStrictEqual(empty.requests[0].params, { types: '13' });
            assert.deepStrictEqual(empty.sent, [{ data: {}, port: 'notFound' }]);
        });

        it('Update: sends the current values together with the change', async function() {
            const current = keypadAuth(AUTH_ID, 'Reservation 48213', 352961, {
                allowedFromDate: '2026-12-12T14:00:00.000Z', allowedUntilDate: '2026-12-15T10:00:00.000Z', allowedWeekDays: 127
            });
            const context = createContext({
                content: { smartlockId: LOCK_ID, authorizationId: AUTH_ID, allowedUntilDate: '2026-12-16T10:00:00Z' },
                responses: [{ data: current }, { status: 204 }]
            });
            await UpdateSmartlockAuthorization.receive(context);
            assert.strictEqual(context.requests[1].method, 'POST');
            assert.strictEqual(context.requests[1].url, `${API}/smartlock/${LOCK_ID}/auth/${AUTH_ID}`);
            assert.deepStrictEqual(context.requests[1].data, {
                name: 'Reservation 48213',
                enabled: true,
                remoteAllowed: false,
                allowedFromDate: '2026-12-12T14:00:00.000Z',
                allowedUntilDate: '2026-12-16T10:00:00.000Z',
                allowedWeekDays: 127
            });
            assert.deepStrictEqual(context.sent, [{ data: {}, port: 'out' }]);
        });

        it('Update: can disable, and refuses to run with nothing to change', async function() {
            const context = createContext({
                content: { smartlockId: LOCK_ID, authorizationId: AUTH_ID, enabled: 'false' },
                responses: [{ data: keypadAuth(AUTH_ID, 'Guest', 352961) }, { status: 204 }]
            });
            await UpdateSmartlockAuthorization.receive(context);
            assert.strictEqual(context.requests[1].data.enabled, false);
            assert.strictEqual(context.requests[1].data.name, 'Guest');
            assert.ok(!('code' in context.requests[1].data));

            const nothing = createContext({ content: { smartlockId: LOCK_ID, authorizationId: AUTH_ID } });
            await assert.rejects(UpdateSmartlockAuthorization.receive(nothing), /Nothing to update/);
            assert.strictEqual(nothing.requests.length, 0);
        });

        it('Update: does not write when the authorization cannot be read', async function() {
            const context = createContext({
                content: { smartlockId: LOCK_ID, authorizationId: AUTH_ID, enabled: 'false' },
                responses: [{ data: '' }]
            });
            await assert.rejects(UpdateSmartlockAuthorization.receive(context), /was not found/);
            assert.strictEqual(context.requests.length, 1);
        });

        it('Delete: sends DELETE and returns an empty object', async function() {
            const context = createContext({ content: { smartlockId: LOCK_ID, authorizationId: AUTH_ID }, responses: [{ status: 204 }] });
            await DeleteSmartlockAuthorization.receive(context);
            assert.strictEqual(context.requests[0].method, 'DELETE');
            assert.strictEqual(context.requests[0].url, `${API}/smartlock/${LOCK_ID}/auth/${AUTH_ID}`);
            assert.deepStrictEqual(context.sent, [{ data: {}, port: 'out' }]);
        });
    });

    describe('FindLogEntries', function() {

        it('reads the log of one device or of all devices with the maximum page size', async function() {
            const one = createContext({
                content: { smartlockId: LOCK_ID, action: '1', authorizationId: AUTH_ID, fromDate: '2026-12-12T00:00:00Z' },
                responses: [{ data: [logEntry('a', '2026-12-12T15:04:11.000Z')] }]
            });
            await FindLogEntries.receive(one);
            assert.strictEqual(one.requests[0].url, `${API}/smartlock/${LOCK_ID}/log`);
            assert.deepStrictEqual(one.requests[0].params, {
                limit: 50, fromDate: '2026-12-12T00:00:00.000Z', action: 1, authId: AUTH_ID
            });

            const all = createContext({ content: {}, responses: [{ data: [] }] });
            await FindLogEntries.receive(all);
            assert.strictEqual(all.requests[0].url, `${API}/smartlock/log`);
            assert.deepStrictEqual(all.requests[0].params, { limit: 50 });
            assert.deepStrictEqual(all.sent, [{ data: {}, port: 'notFound' }]);
        });

        it('refuses the authorization filter without a device instead of ignoring it', async function() {
            const context = createContext({ content: { authorizationId: AUTH_ID } });
            await assert.rejects(FindLogEntries.receive(context), /Smartlock is required when Authorization ID is set/);
            assert.strictEqual(context.requests.length, 0);
        });
    });

    describe('CreateAccountUser', function() {

        it('returns the created user and fails on an answer without an ID', async function() {
            const user = { accountUserId: 77, accountId: 5, email: 'jane@example.com', name: 'Jane' };
            const context = createContext({ content: { name: ' Jane ', email: 'jane@example.com', language: 'en' }, responses: [{ data: user }] });
            await CreateAccountUser.receive(context);
            assert.strictEqual(context.requests[0].method, 'PUT');
            assert.deepStrictEqual(context.requests[0].data, { name: 'Jane', email: 'jane@example.com', language: 'en' });
            assert.deepStrictEqual(context.sent, [{ data: user, port: 'out' }]);

            const empty = createContext({ content: { name: 'Jane', email: 'jane@example.com' }, responses: [{ data: '' }] });
            await assert.rejects(CreateAccountUser.receive(empty), /returned no account user/);
            assert.strictEqual(empty.sent.length, 0);
        });
    });

    describe('NewLogEntry', function() {

        const page = (from, count) => Array.from({ length: count }, (_, i) => {
            const n = from - i;
            return logEntry('id' + n, new Date(Date.UTC(2026, 11, 1, 0, 0, n)).toISOString());
        });

        it('first check records a baseline and emits nothing', async function() {
            const context = createContext({ responses: [{ data: page(3, 3) }] });
            await NewLogEntry.tick(context);
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.state.initialized, true);
            assert.deepStrictEqual(context.state.known, ['id1', 'id2', 'id3']);
            assert.strictEqual(context.state.floor, null);
        });

        it('fires the first entry ever on an account that was empty at the baseline', async function() {
            const context = createContext({ responses: [{ data: [] }, { data: page(1, 1) }] });
            await NewLogEntry.tick(context);
            assert.strictEqual(context.state.initialized, true);
            await NewLogEntry.tick(context);
            assert.deepStrictEqual(context.sent.map(sent => sent.data.id), ['id1']);
        });

        it('fires only new entries, oldest first', async function() {
            const context = createContext({ responses: [{ data: page(3, 3) }, { data: page(5, 5) }, { data: page(5, 5) }] });
            await NewLogEntry.tick(context);
            await NewLogEntry.tick(context);
            assert.deepStrictEqual(context.sent.map(sent => sent.data.id), ['id4', 'id5']);
            await NewLogEntry.tick(context);
            assert.strictEqual(context.sent.length, 2);
        });

        it('does not fire an old entry that slides onto a full page', async function() {
            // 50 entries known (id51..id100, floor = date of id51). The filter then matches one entry
            // less and id50, older than the floor, slides onto the page.
            const first = page(100, 50);
            const second = [...first.filter(entry => entry.id !== 'id100'), logEntry('id50', new Date(Date.UTC(2026, 11, 1, 0, 0, 50)).toISOString())];
            const context = createContext({ responses: [{ data: first }, { data: second }] });
            await NewLogEntry.tick(context);
            assert.strictEqual(context.state.floor, new Date(Date.UTC(2026, 11, 1, 0, 0, 51)).toISOString());
            await NewLogEntry.tick(context);
            assert.strictEqual(context.sent.length, 0);
        });

        it('reads older pages when a whole page is new, and stops at a known entry', async function() {
            const context = createContext({
                responses: [{ data: page(10, 10) }, { data: page(110, 50) }, { data: page(60, 50) }, { data: page(10, 10) }]
            });
            await NewLogEntry.tick(context);
            await NewLogEntry.tick(context);
            assert.strictEqual(context.requests.length, 4);
            assert.strictEqual(context.requests[2].params.id, 'id61');
            assert.strictEqual(context.requests[3].params.id, 'id11');
            assert.strictEqual(context.sent.length, 100);
            assert.strictEqual(context.sent[0].data.id, 'id11');
            assert.strictEqual(context.sent[99].data.id, 'id110');
        });

        it('keeps the state when the answer is empty while entries are known', async function() {
            const context = createContext({ responses: [{ data: page(3, 3) }, { data: [] }, { data: page(3, 3) }] });
            await NewLogEntry.tick(context);
            const state = JSON.stringify(context.state);
            await NewLogEntry.tick(context);
            assert.strictEqual(JSON.stringify(context.state), state);
            await NewLogEntry.tick(context);
            assert.strictEqual(context.sent.length, 0);
        });

        it('passes the filters and uses the log of the selected device', async function() {
            const context = createContext({ properties: { smartlockId: LOCK_ID, action: '1' }, responses: [{ data: [] }] });
            await NewLogEntry.tick(context);
            assert.strictEqual(context.requests[0].url, `${API}/smartlock/${LOCK_ID}/log`);
            assert.deepStrictEqual(context.requests[0].params, { limit: 50, action: 1 });
        });

        it('test() emits the newest entry without touching the state, and throws when there is none', async function() {
            const context = createContext({ state: { marker: 1 }, responses: [{ data: page(3, 1) }] });
            await NewLogEntry.test(context);
            assert.deepStrictEqual(context.requests[0].params, { limit: 1 });
            assert.strictEqual(context.sent[0].data.id, 'id3');
            assert.deepStrictEqual(context.state, { marker: 1 });

            const empty = createContext({ responses: [{ data: [] }] });
            await assert.rejects(NewLogEntry.test(empty), CancelError);
        });
    });

    describe('SmartlockStateChanged', function() {

        it('records a baseline, then fires with the changed fields and the previous values', async function() {
            const context = createContext({
                responses: [
                    { data: [onlineLock()] },
                    { data: [onlineLock()] },
                    { data: [onlineLock({ state: { state: 3, doorState: 3, batteryCritical: false } })] }
                ]
            });
            await SmartlockStateChanged.tick(context);
            await SmartlockStateChanged.tick(context);
            assert.strictEqual(context.sent.length, 0);
            await SmartlockStateChanged.tick(context);
            assert.strictEqual(context.sent.length, 1);
            assert.deepStrictEqual(context.sent[0].data.changedFields, ['lockState', 'doorState']);
            assert.deepStrictEqual(context.sent[0].data.previous, {
                lockState: 1, doorState: 2, batteryCritical: false, serverState: 0
            });
            assert.strictEqual(context.sent[0].data.state.state, 3);
        });

        it('fires only for the watched fields but still records the others', async function() {
            const context = createContext({
                properties: { watch: ['serverState'] },
                responses: [
                    { data: [onlineLock()] },
                    { data: [onlineLock({ state: { state: 3, doorState: 2, batteryCritical: false } })] },
                    { data: [onlineLock({ serverState: 4, state: { state: 3, doorState: 2, batteryCritical: false } })] }
                ]
            });
            await SmartlockStateChanged.tick(context);
            await SmartlockStateChanged.tick(context);
            assert.strictEqual(context.sent.length, 0);
            await SmartlockStateChanged.tick(context);
            assert.deepStrictEqual(context.sent[0].data.changedFields, ['serverState']);
        });

        it('does not fire for a device seen for the first time, nor after an empty answer', async function() {
            const context = createContext({
                responses: [
                    { data: [onlineLock()] },
                    { data: [] },
                    { data: [onlineLock(), onlineLock({ smartlockId: 2, name: 'Garage' })] }
                ]
            });
            await SmartlockStateChanged.tick(context);
            const state = JSON.stringify(context.state);
            await SmartlockStateChanged.tick(context);
            assert.strictEqual(JSON.stringify(context.state), state);
            await SmartlockStateChanged.tick(context);
            assert.strictEqual(context.sent.length, 0);
            assert.deepStrictEqual(Object.keys(context.state.devices).sort(), ['2', LOCK_ID]);
        });

        it('watches one device through GET /smartlock/{id}', async function() {
            const context = createContext({ properties: { smartlockId: LOCK_ID }, responses: [{ data: onlineLock() }] });
            await SmartlockStateChanged.tick(context);
            assert.strictEqual(context.requests[0].url, `${API}/smartlock/${LOCK_ID}`);
        });

        it('test() emits the current device without touching the state', async function() {
            const context = createContext({ state: { marker: 1 }, responses: [{ data: [onlineLock()] }] });
            await SmartlockStateChanged.test(context);
            assert.deepStrictEqual(context.sent[0].data.changedFields, []);
            assert.deepStrictEqual(context.state, { marker: 1 });
        });
    });
});

describe('Nuki review fixes', function() {

    it('finds a created keypad code even when Nuki stores the name differently, and prefers the same name', function() {
        const stored = keypadAuth(AUTH_ID, 'Reservation 4821', 352961);
        const wanted = { type: 13, name: 'Reservation 48213', code: 352961, knownIds: [] };
        assert.strictEqual(lib.matchCreatedAuthorization([stored], wanted), stored);
        assert.strictEqual(lib.matchCreatedAuthorization([keypadAuth('b', 'Guest', 999999)], wanted), undefined);

        const twin = { id: 'c', type: 0, name: 'Guest', accountUserId: 77 };
        const other = { id: 'd', type: 0, name: 'Other', accountUserId: 77 };
        const invite = { type: 0, name: 'Guest', accountUserId: 77, knownIds: [] };
        assert.strictEqual(lib.matchCreatedAuthorization([other, twin], invite), twin);
    });

    it('creates a keypad code on a device that does not report the keypad flags', async function() {
        const context = createContext({
            content: { smartlockId: LOCK_ID, name: 'Guest', code: '352961' },
            responses: [{ data: onlineLock({ config: {} }) }, { data: [] }, { status: 204 }, { data: [] }, { data: [] }]
        });
        const realSleep = lib.sleep;
        lib.sleep = async () => {};
        try {
            await CreateKeypadCode.receive(context);
        } finally {
            lib.sleep = realSleep;
        }
        assert.strictEqual(context.requests.filter(request => request.method === 'PUT').length, 1);
    });

    it('State Changed does not fire when a value is missing from one answer and back in the next', async function() {
        const context = createContext({
            responses: [
                { data: [onlineLock()] },
                { data: [onlineLock({ state: { state: 1, batteryCritical: false } })] },
                { data: [onlineLock()] }
            ]
        });
        await SmartlockStateChanged.tick(context);
        await SmartlockStateChanged.tick(context);
        await SmartlockStateChanged.tick(context);
        assert.strictEqual(context.sent.length, 0);
        assert.strictEqual(context.state.devices[LOCK_ID].doorState, 2);
    });

    it('answers a dropdown source call that carries no input message', async function() {
        const context = createContext({ properties: { isSource: true }, responses: [{ data: [onlineLock()] }] });
        context.messages = {};
        await FindSmartlocks.receive(context);
        assert.strictEqual(context.sent[0].data.result.length, 1);
    });
});
