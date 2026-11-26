'use strict';

const assert = require('assert');
const lib = require('../../lib');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const CreateOpportunity = require('../../core/CreateOpportunity/CreateOpportunity');
const NewCompany = require('../../core/NewCompany/NewCompany');
const CompanyUpdated = require('../../core/CompanyUpdated/CompanyUpdated');
const NewOrder = require('../../core/NewOrder/NewOrder');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

const API_KEY = 'secret-key-123';

/**
 * A mock component context. `responder(options)` returns { data, status, headers } or throws.
 */
const createContext = ({ responder, content = {}, state = {} } = {}) => {
    const requests = [];
    const sent = [];
    const context = {
        auth: { apiKey: API_KEY },
        config: {},
        properties: {},
        messages: { in: { content } },
        state: { ...state },
        CancelError,
        requests,
        sent,
        async httpRequest(options) {
            requests.push(options);
            const res = await responder(options);
            return { status: 200, headers: {}, ...res };
        },
        async sendJson(data, port) {
            sent.push({ data, port });
        },
        async saveState(next) {
            context.state = next;
        },
        staticCache: {
            store: {},
            async get(key) {
                return this.store[key];
            },
            async set(key, value) {
                this.store[key] = value;
            }
        },
        async lock() {
            return { unlock() {} };
        }
    };
    return context;
};

const query = (options) => new URL(options.url).searchParams;
const list = (items, total = items.length) => ({
    data: { error: null, metadata: { total, limit: 1, offset: 0 }, data: items }
});

describe('upsales lib.request', function() {

    it('sends the API key as the token query parameter and repeats array filters', async function() {
        const context = createContext({ responder: async () => list([]) });
        await lib.list(context, '/orders', { probability: ['gte:1', 'lte:99'], 'client.id': 12, empty: undefined });
        const params = query(context.requests[0]);
        assert.strictEqual(new URL(context.requests[0].url).origin + new URL(context.requests[0].url).pathname,
            'https://integration.upsales.com/api/v2/orders');
        assert.strictEqual(params.get('token'), API_KEY);
        assert.deepStrictEqual(params.getAll('probability'), ['gte:1', 'lte:99']);
        assert.strictEqual(params.get('client.id'), '12');
        assert.strictEqual(params.has('empty'), false);
    });

    it('never puts the API key into an error message', async function() {
        const context = createContext({
            responder: async (options) => {
                const error = new Error('Request failed for ' + options.url);
                error.response = { status: 400, data: { error: { key: 'BadRequest', msg: 'Bad value' } } };
                throw error;
            }
        });
        await assert.rejects(lib.request(context, { path: '/accounts' }), (error) => {
            assert.ok(!error.message.includes(API_KEY), error.message);
            assert.ok(error.message.includes('(400)'));
            assert.ok(error.message.includes('Bad value'));
            return true;
        });
    });

    it('redacts a token that appears in an upstream message', function() {
        assert.strictEqual(lib.redact('GET /x?token=abc&limit=1'), 'GET /x?token=***&limit=1');
    });

    it('retries a 429 and returns the next answer', async function() {
        this.timeout(5000);
        let calls = 0;
        const context = createContext({
            responder: async () => {
                calls++;
                if (calls === 1) {
                    const error = new Error('Too many requests');
                    error.response = { status: 429, headers: { 'x-ratelimit-reset': '0.01' }, data: {} };
                    throw error;
                }
                return list([{ id: 1 }]);
            }
        });
        const { items } = await lib.list(context, '/accounts');
        assert.strictEqual(calls, 2);
        assert.deepStrictEqual(items, [{ id: 1 }]);
    });
});

describe('upsales MakeApiCall', function() {

    it('refuses a foreign host and makes no request', async function() {
        for (const url of ['https://evil.example/api', '//evil.example/x', 'https://user:pw@integration.upsales.com/api/v2/self']) {
            const context = createContext({ responder: async () => ({ data: {} }), content: { url, method: 'GET' } });
            await assert.rejects(MakeApiCall.receive(context), CancelError);
            assert.strictEqual(context.requests.length, 0, url);
        }
    });

    it('calls a relative path, passes key-value parameters and replaces a user supplied token', async function() {
        const context = createContext({
            responder: async () => ({ data: { error: null, data: [] } }),
            content: { url: '/accounts?token=other', method: 'GET', parameters: '{"client.id":"eq:12"}', headers: '{"Accept":"application/json"}' }
        });
        await MakeApiCall.receive(context);
        const params = query(context.requests[0]);
        assert.strictEqual(params.get('client.id'), 'eq:12');
        assert.deepStrictEqual(params.getAll('token'), [API_KEY]);
        assert.strictEqual(context.requests[0].headers.Accept, 'application/json');
        assert.strictEqual(context.sent[0].data.statusCode, 200);
    });
});

describe('upsales CreateOpportunity', function() {

    it('builds one order row and takes the probability from the stage', async function() {
        const context = createContext({
            responder: async (options) => {
                if (options.method === 'GET') return { data: { error: null, data: { id: 9, probability: 25 } } };
                return { data: { error: null, data: { id: 100 } } };
            },
            content: { companyId: '2', userId: '1', stageId: '9', description: '10 licenses', date: '2026-12-01T10:00:00.000Z', productId: '3', price: 9000 }
        });
        await CreateOpportunity.receive(context);
        const post = context.requests.find(r => r.method === 'POST');
        assert.deepStrictEqual(post.data, {
            description: '10 licenses',
            date: '2026-12-01',
            user: { id: 1 },
            client: { id: 2 },
            stage: { id: 9 },
            probability: 25,
            orderRow: [{ product: { id: 3 }, quantity: 1, price: 9000 }]
        });
        assert.deepStrictEqual(context.sent[0], { data: { id: 100 }, port: 'out' });
    });

    it('rejects a stage with probability 100', async function() {
        const context = createContext({
            responder: async () => ({ data: { error: null, data: { id: 12, probability: 100 } } }),
            content: { companyId: '2', userId: '1', stageId: '12', description: 'x', date: '2026-12-01', productId: '3', price: 1 }
        });
        await assert.rejects(CreateOpportunity.receive(context), CancelError);
    });
});

describe('upsales polling triggers', function() {

    it('NewCompany: first tick stores the newest id and emits nothing', async function() {
        const context = createContext({
            responder: async (options) => {
                const params = query(options);
                assert.strictEqual(params.get('sort'), 'id');
                assert.strictEqual(params.get('isExternal'), '0');
                return params.get('offset') ? list([{ id: 57 }], 3) : list([{ id: 5 }], 3);
            }
        });
        await NewCompany.tick(context);
        assert.strictEqual(context.sent.length, 0);
        assert.deepStrictEqual(context.state, { lastId: 57 });
    });

    it('NewCompany: emits records above the last id in id order and moves the cursor', async function() {
        const context = createContext({
            state: { lastId: 57 },
            responder: async (options) => {
                assert.strictEqual(query(options).get('id'), 'gt:57');
                return list([{ id: 60 }, { id: 58 }]);
            }
        });
        await NewCompany.tick(context);
        assert.deepStrictEqual(context.sent.map(s => s.data.id), [58, 60]);
        assert.deepStrictEqual(context.state, { lastId: 60 });
    });

    it('NewCompany: an empty answer keeps the state', async function() {
        const context = createContext({ state: { lastId: 57 }, responder: async () => list([]) });
        await NewCompany.tick(context);
        assert.strictEqual(context.sent.length, 0);
        assert.deepStrictEqual(context.state, { lastId: 57 });
    });

    it('CompanyUpdated: fires each change once, also at the cursor timestamp', async function() {
        const since = '2026-11-26T08:00:00.000Z';
        let answer = [{ id: 1, modDate: since }, { id: 2, modDate: '2026-11-26T08:01:00.000Z' }];
        const context = createContext({
            state: { since, boundary: ['1:' + since] },
            responder: async (options) => {
                assert.strictEqual(query(options).get('modDate'), 'gte:' + context.state.since);
                return list(answer);
            }
        });
        await CompanyUpdated.tick(context);
        assert.deepStrictEqual(context.sent.map(s => s.data.id), [2]);
        assert.strictEqual(context.state.since, '2026-11-26T08:01:00.000Z');

        // same answer again (record 2 unchanged) - nothing fires
        answer = [{ id: 2, modDate: '2026-11-26T08:01:00.000Z' }];
        await CompanyUpdated.tick(context);
        assert.strictEqual(context.sent.length, 1);

        // record 2 changes again - it fires again
        answer = [{ id: 2, modDate: '2026-11-26T08:05:00.000Z' }];
        await CompanyUpdated.tick(context);
        assert.deepStrictEqual(context.sent.map(s => s.data.id), [2, 2]);
    });

    it('NewOrder: an order fires once even when it is modified later', async function() {
        let answer = [{ id: 7, modDate: '2026-11-26T08:01:00.000Z', probability: 100 }];
        const context = createContext({
            state: { since: '2026-11-26T08:00:00.000Z', boundary: [], emitted: [] },
            responder: async (options) => {
                assert.strictEqual(query(options).get('probability'), '100');
                return list(answer);
            }
        });
        await NewOrder.tick(context);
        answer = [{ id: 7, modDate: '2026-11-26T08:09:00.000Z', probability: 100 }];
        await NewOrder.tick(context);
        assert.deepStrictEqual(context.sent.map(s => s.data.id), [7]);
    });

    it('test() emits the newest record without touching the state', async function() {
        const context = createContext({
            responder: async (options) => (query(options).get('offset') ? list([{ id: 9 }], 2) : list([{ id: 3 }], 2))
        });
        context.saveState = async () => assert.fail('test() must not save state');
        await NewCompany.test(context);
        assert.deepStrictEqual(context.sent, [{ data: { id: 9 }, port: 'out' }]);
    });
});
