'use strict';

const assert = require('assert');

const lib = require('../../lib');
const auth = require('../../auth');
const CreateBoard = require('../../core/CreateBoard/CreateBoard');
const FindBoards = require('../../core/FindBoards/FindBoards');
const UpdateBoard = require('../../core/UpdateBoard/UpdateBoard');
const ShareBoard = require('../../core/ShareBoard/ShareBoard');
const CreateStickyNote = require('../../core/CreateStickyNote/CreateStickyNote');
const CreateCard = require('../../core/CreateCard/CreateCard');
const CreateShape = require('../../core/CreateShape/CreateShape');
const CreateConnector = require('../../core/CreateConnector/CreateConnector');
const ListItems = require('../../core/ListItems/ListItems');
const GetItem = require('../../core/GetItem/GetItem');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const NewBoard = require('../../core/NewBoard/NewBoard');
const UpdatedBoard = require('../../core/UpdatedBoard/UpdatedBoard');
const NewItem = require('../../core/NewItem/NewItem');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

const API = 'https://api.miro.com/v2';

// A response of an Error makes httpRequest reject with it.
const createContext = ({ content = {}, properties = {}, state = {}, responses = [], profileInfo } = {}) => {

    const context = {
        auth: { accessToken: 'token-1', profileInfo: profileInfo === undefined ? { teamId: '777' } : profileInfo },
        config: {},
        properties,
        state: { ...state },
        componentId: 'component-1',
        flowId: 'flow-1',
        messages: { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        cache: {},
        async httpRequest(options) {
            this.requests.push(options);
            const next = responses.length ? responses.shift() : { data: {} };
            if (next instanceof Error) {
                throw next;
            }
            return { status: 200, headers: {}, ...next };
        },
        async sendJson(data, port) {
            this.sent.push({ data, port });
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

const httpError = (status, data, headers = {}) => Object.assign(new Error('Request failed with status code ' + status), {
    response: { status, data, headers }
});

const board = (id, createdAt, modifiedAt) => ({ id, name: 'Board ' + id, type: 'board', createdAt, modifiedAt: modifiedAt || createdAt });

describe('Miro', function() {

    describe('lib', function() {

        it('sends the access token as a Bearer token', function() {
            assert.deepStrictEqual(lib.authHeaders({ auth: { accessToken: 'abc' } }), { Authorization: 'Bearer abc' });
        });

        it('encodes IDs so they cannot change the URL path', function() {
            const context = createContext();
            assert.strictEqual(lib.requireId(context, ' uXjVLmJ9b1E= ', 'Board'), 'uXjVLmJ9b1E%3D');
            assert.strictEqual(lib.requireId(context, '12/../../boards', 'Board'), '12%2F..%2F..%2Fboards');
            assert.throws(() => lib.requireId(context, '  ', 'Board'), /Board is required/);
        });

        it('retries a 429 answer and returns the next one', async function() {
            const context = createContext({
                responses: [httpError(429, { code: 'tooManyRequests' }, { 'retry-after': '0' }), { data: { id: 'b1' } }]
            });
            const body = await lib.request(context, { path: '/boards/b1' });
            assert.deepStrictEqual(body, { id: 'b1' });
            assert.strictEqual(context.requests.length, 2);
        });

        it('turns a 404 into a CancelError with Miro\'s message', async function() {
            const context = createContext({
                responses: [httpError(404, { status: 404, code: 'notFound', message: 'Board not found', type: 'error' })]
            });
            await assert.rejects(lib.request(context, { path: '/boards/x' }), err => {
                assert.ok(err instanceof CancelError);
                assert.match(err.message, /HTTP 404, notFound\): Board not found/);
                return true;
            });
        });

        it('waits until X-RateLimit-Reset, capped', function() {
            assert.strictEqual(lib.retryDelay({ 'Retry-After': '3' }), 3000);
            assert.strictEqual(lib.retryDelay({ 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600) }), 10000);
            assert.strictEqual(lib.retryDelay({}), 1000);
        });

        it('reads the team from the token context when the profile has none, once', async function() {
            const context = createContext({ profileInfo: {}, responses: [{ data: { team: { id: '55', name: 'T' } } }] });
            assert.strictEqual(await lib.defaultTeamId(context), '55');
            assert.strictEqual(await lib.defaultTeamId(context), '55');
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.requests[0].url, 'https://api.miro.com/v1/oauth-token');
        });
    });

    describe('auth', function() {

        it('exchanges the code with query parameters and keeps the refresh token', async function() {
            const context = createContext({
                responses: [{ data: { access_token: 'at', refresh_token: 'rt', expires_in: 3599, team_id: '777', user_id: '1' } }]
            });
            Object.assign(context, { clientId: 'cid', clientSecret: 'sec', authorizationCode: 'code', callbackUrl: 'https://cb' });
            const tokens = await auth.definition.requestAccessToken(context);
            const request = context.requests[0];
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.url, 'https://api.miro.com/v1/oauth/token');
            assert.deepStrictEqual(request.params, {
                grant_type: 'authorization_code', client_id: 'cid', client_secret: 'sec', code: 'code', redirect_uri: 'https://cb'
            });
            assert.strictEqual(tokens.accessToken, 'at');
            assert.strictEqual(tokens.refreshToken, 'rt');
            assert.ok(tokens.accessTokenExpDate > new Date());
        });

        it('stores the new refresh token of every refresh', async function() {
            const context = createContext({ responses: [{ data: { access_token: 'at2', refresh_token: 'rt2', expires_in: 3599 } }] });
            Object.assign(context, { clientId: 'cid', clientSecret: 'sec', refreshToken: 'rt1' });
            const tokens = await auth.definition.refreshAccessToken(context);
            assert.strictEqual(context.requests[0].params.grant_type, 'refresh_token');
            assert.strictEqual(context.requests[0].params.refresh_token, 'rt1');
            assert.strictEqual(tokens.refreshToken, 'rt2');
        });

        it('names the account after the user and team of the token', async function() {
            const context = createContext({
                responses: [{ data: { user: { id: '1', name: 'Jane' }, team: { id: '777', name: 'Product' }, organization: { id: 'o', name: 'Org' } } }]
            });
            context.auth = undefined;
            context.accessToken = 'at';
            const profile = await auth.definition.requestProfileInfo(context);
            assert.strictEqual(profile.teamId, '777');
            assert.strictEqual(context.requests[0].headers.Authorization, 'Bearer at');
            assert.strictEqual(auth.definition.accountNameFromProfileInfo({ profileInfo: profile }), 'Jane (Product)');
        });
    });

    describe('boards', function() {

        it('creates a board in the account\'s team and sends only the fields set', async function() {
            const context = createContext({ content: { name: 'Plan', access: 'view' }, responses: [{ data: { id: 'b1' } }] });
            await CreateBoard.receive(context);
            assert.deepStrictEqual(context.requests[0].data, { name: 'Plan', teamId: '777', policy: { sharingPolicy: { access: 'view' } } });
            assert.deepStrictEqual(context.sent[0], { data: { id: 'b1' }, port: 'out' });
        });

        it('refuses an update without any field', async function() {
            const context = createContext({ content: { boardId: 'b1' } });
            await assert.rejects(UpdateBoard.receive(context), /at least one field/);
            assert.strictEqual(context.requests.length, 0);
        });

        it('lists the boards of the account\'s team when no filter is set', async function() {
            const context = createContext({ content: { outputType: 'first' }, responses: [{ data: { data: [board('b1', '2026-11-20T10:00:00Z')], total: 1 } }] });
            await FindBoards.receive(context);
            assert.deepStrictEqual(context.requests[0].params, { limit: '50', team_id: '777' });
            assert.strictEqual(context.sent[0].data.id, 'b1');
        });

        it('searches without the team, which would make Miro ignore the search text', async function() {
            const context = createContext({ content: { query: 'roadmap', outputType: 'array' }, responses: [{ data: { data: [] } }] });
            await FindBoards.receive(context);
            assert.deepStrictEqual(context.requests[0].params, { limit: '50', query: 'roadmap' });
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'notFound' });
        });

        it('returns no options instead of an error to the designer', async function() {
            const context = createContext({ properties: { isSource: true }, responses: [httpError(401, { message: 'Unauthorized' })] });
            await FindBoards.receive(context);
            assert.deepStrictEqual(context.sent[0], { data: { result: [], count: 0 }, port: 'out' });
            assert.deepStrictEqual(FindBoards.toSelectArray({ result: [board('b1')] }), [{ label: 'Board b1', value: 'b1' }]);
        });

        it('shares a board with comma separated emails', async function() {
            const context = createContext({
                content: { boardId: 'b1', emails: 'a@example.com, b@example.com', role: 'editor' },
                responses: [{ data: { successful: [11], failed: [{ email: 'b@example.com', reason: 'not a team member' }] } }]
            });
            await ShareBoard.receive(context);
            assert.strictEqual(context.requests[0].url, API + '/boards/b1/members');
            assert.deepStrictEqual(context.requests[0].data, { emails: ['a@example.com', 'b@example.com'], role: 'editor' });
            assert.strictEqual(context.sent[0].data.successfulCount, 1);
            assert.strictEqual(context.sent[0].data.failedCount, 1);
        });
    });

    describe('items', function() {

        it('creates a sticky note with style, position and frame', async function() {
            const context = createContext({
                content: { boardId: 'b=1', content: 'Hi', fillColor: 'yellow', x: '10', y: 0, width: 200, parentId: '345' },
                responses: [{ data: { id: 'i1', type: 'sticky_note' } }]
            });
            await CreateStickyNote.receive(context);
            assert.strictEqual(context.requests[0].url, API + '/boards/b%3D1/sticky_notes');
            assert.deepStrictEqual(context.requests[0].data, {
                data: { content: 'Hi' },
                style: { fillColor: 'yellow' },
                position: { x: 10, y: 0 },
                geometry: { width: 200 },
                parent: { id: '345' }
            });
        });

        it('rejects a position that is not a number before calling Miro', async function() {
            const context = createContext({ content: { boardId: 'b1', content: 'Hi', x: 'left' } });
            await assert.rejects(CreateStickyNote.receive(context), /X must be a number/);
            assert.strictEqual(context.requests.length, 0);
        });

        it('creates a card with the due date in ISO format', async function() {
            const context = createContext({ content: { boardId: 'b1', title: 'Task', dueDate: '2026-12-01T10:00:00+01:00' } });
            await CreateCard.receive(context);
            assert.deepStrictEqual(context.requests[0].data, { data: { title: 'Task', dueDate: '2026-12-01T09:00:00.000Z' } });
        });

        it('creates a rectangle when no shape is chosen', async function() {
            const context = createContext({ content: { boardId: 'b1', content: 'Start', height: 50 } });
            await CreateShape.receive(context);
            assert.deepStrictEqual(context.requests[0].data, { data: { shape: 'rectangle', content: 'Start' }, geometry: { height: 50 } });
        });

        it('connects two items with a caption', async function() {
            const context = createContext({ content: { boardId: 'b1', startItemId: '1', endItemId: '2', caption: 'next', endStrokeCap: 'arrow' } });
            await CreateConnector.receive(context);
            assert.deepStrictEqual(context.requests[0].data, {
                startItem: { id: '1' }, endItem: { id: '2' }, style: { endStrokeCap: 'arrow' }, captions: [{ content: 'next' }]
            });
        });

        it('lists one page of items of a type', async function() {
            const context = createContext({ content: { boardId: 'b1', type: 'card', outputType: 'array' }, responses: [{ data: { data: [{ id: 'i1' }], cursor: 'c2' } }] });
            await ListItems.receive(context);
            assert.deepStrictEqual(context.requests[0].params, { limit: '50', type: 'card' });
            assert.strictEqual(context.requests.length, 1);
            assert.deepStrictEqual(context.sent[0].data, { result: [{ id: 'i1' }], count: 1 });
        });

        it('offers no item options until a board is chosen', async function() {
            const context = createContext({ properties: { isSource: true }, content: {} });
            await ListItems.receive(context);
            assert.deepStrictEqual(context.sent[0].data, { result: [], count: 0 });
            assert.strictEqual(context.requests.length, 0);
            assert.deepStrictEqual(ListItems.toSelectArray({ result: [{ id: '1', type: 'sticky_note', data: { content: '<p>Hello</p>' } }] }),
                [{ label: 'sticky_note: Hello', value: '1' }]);
        });

        it('requires the item ID', async function() {
            const context = createContext({ content: { boardId: 'b1' } });
            await assert.rejects(GetItem.receive(context), /Item is required/);
        });
    });

    describe('MakeApiCall', function() {

        it('calls a path on the Miro API with the Designer\'s key-value strings', async function() {
            const context = createContext({
                content: { url: '/v2/boards', method: 'GET', parameters: '{"limit":"5"}', headers: '{"Accept":"application/json"}' },
                responses: [{ status: 200, data: { data: [] } }]
            });
            await MakeApiCall.receive(context);
            assert.strictEqual(context.requests[0].url, 'https://api.miro.com/v2/boards');
            assert.deepStrictEqual(context.requests[0].params, { limit: '5' });
            assert.strictEqual(context.requests[0].headers.Accept, 'application/json');
            assert.strictEqual(context.requests[0].headers.Authorization, 'Bearer token-1');
            assert.strictEqual(context.sent[0].data.statusCode, 200);
        });

        it('never sends the token to another host', async function() {
            for (const url of ['https://evil.example/v2/boards', '//evil.example/x', 'https://user:pw@api.miro.com/v2/boards', 'http://api.miro.com/v2']) {
                const context = createContext({ content: { url, method: 'GET' } });
                await assert.rejects(MakeApiCall.receive(context), CancelError, url);
                assert.strictEqual(context.requests.length, 0, url);
            }
        });
    });

    describe('triggers', function() {

        it('NewBoard: the first check only remembers the newest board', async function() {
            const context = createContext({ responses: [{ data: { data: [board('b2', '2026-11-20T10:00:00Z'), board('b1', '2026-11-19T10:00:00Z')], total: 2 } }] });
            await NewBoard.tick(context);
            assert.strictEqual(context.sent.length, 0);
            assert.deepStrictEqual(context.requests[0].params, { limit: '50', team_id: '777', sort: 'last_created' });
            assert.strictEqual(context.state.lastTimestamp, Date.parse('2026-11-20T10:00:00Z'));
        });

        it('NewBoard: emits only boards created after the last check, oldest first', async function() {
            const state = { initialized: true, lastTimestamp: Date.parse('2026-11-20T10:00:00Z'), known: ['b2'] };
            const context = createContext({
                state,
                responses: [{ data: { data: [
                    board('b4', '2026-11-20T12:00:00Z'), board('b3', '2026-11-20T11:00:00Z'),
                    board('b2', '2026-11-20T10:00:00Z'), board('b1', '2026-11-19T10:00:00Z')
                ], total: 4 } }]
            });
            await NewBoard.tick(context);
            assert.deepStrictEqual(context.sent.map(s => s.data.id), ['b3', 'b4']);
            assert.strictEqual(context.state.lastTimestamp, Date.parse('2026-11-20T12:00:00Z'));
        });

        it('NewBoard: pages back until it reaches the last check', async function() {
            const page1 = Array.from({ length: 50 }, (_, i) => board('n' + i, new Date(Date.parse('2026-11-21T00:00:00Z') - i * 1000).toISOString()));
            const state = { initialized: true, lastTimestamp: Date.parse('2026-11-20T00:00:00Z'), known: [] };
            const context = createContext({
                state,
                responses: [{ data: { data: page1, total: 120 } }, { data: { data: [board('old', '2026-11-19T00:00:00Z')], total: 120 } }]
            });
            await NewBoard.tick(context);
            assert.strictEqual(context.requests.length, 2);
            assert.strictEqual(context.requests[1].params.offset, '50');
            assert.strictEqual(context.sent.length, 50);
        });

        it('NewBoard: an empty answer keeps the state', async function() {
            const state = { initialized: true, lastTimestamp: Date.parse('2026-11-20T10:00:00Z'), known: ['b2'] };
            const context = createContext({ state, responses: [{ data: { data: [], total: 0 } }] });
            await NewBoard.tick(context);
            assert.deepStrictEqual(context.state, state);
            assert.strictEqual(context.sent.length, 0);
        });

        it('UpdatedBoard: skips boards that were only created', async function() {
            const state = { initialized: true, lastTimestamp: Date.parse('2026-11-20T10:00:00Z'), known: [] };
            const context = createContext({
                state,
                responses: [{ data: { data: [
                    board('new', '2026-11-20T11:00:00Z'),
                    board('changed', '2026-11-01T11:00:00Z', '2026-11-20T10:30:00Z')
                ], total: 2 } }]
            });
            await UpdatedBoard.tick(context);
            assert.strictEqual(context.requests[0].params.sort, 'last_modified');
            assert.deepStrictEqual(context.sent.map(s => s.data.id), ['changed']);
        });

        it('NewItem: reads every page of the board and emits new items', async function() {
            const state = { initialized: true, lastTimestamp: Date.parse('2026-11-20T10:00:00Z'), known: ['i1'] };
            const context = createContext({
                state,
                properties: { boardId: 'b1', type: 'sticky_note' },
                responses: [
                    { data: { data: [{ id: 'i1', createdAt: '2026-11-20T10:00:00Z' }], cursor: 'c2' } },
                    { data: { data: [{ id: 'i2', createdAt: '2026-11-20T10:05:00Z' }, { id: 'i0', createdAt: '2026-11-18T10:00:00Z' }] } }
                ]
            });
            await NewItem.tick(context);
            assert.strictEqual(context.requests.length, 2);
            assert.deepStrictEqual(context.requests[0].params, { limit: '50', type: 'sticky_note' });
            assert.strictEqual(context.requests[1].params.cursor, 'c2');
            assert.deepStrictEqual(context.sent.map(s => s.data.id), ['i2']);
        });

        it('test(): emits the newest record without touching the state', async function() {
            const context = createContext({
                properties: { boardId: 'b1' },
                responses: [{ data: { data: [{ id: 'old', createdAt: '2026-11-01T00:00:00Z' }, { id: 'new', createdAt: '2026-11-20T00:00:00Z' }] } }]
            });
            context.saveState = async () => {
                throw new Error('test() must not save state');
            };
            await NewItem.test(context);
            assert.deepStrictEqual(context.sent.map(s => s.data.id), ['new']);
        });

        it('test(): throws when there is no example', async function() {
            const context = createContext({ responses: [{ data: { data: [], total: 0 } }] });
            await assert.rejects(NewBoard.test(context), CancelError);
        });
    });
});
