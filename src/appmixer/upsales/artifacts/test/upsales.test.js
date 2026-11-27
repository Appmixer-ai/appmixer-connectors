'use strict';

const assert = require('assert');
const lib = require('../../lib');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const CreateOpportunity = require('../../core/CreateOpportunity/CreateOpportunity');
const NewCompany = require('../../core/NewCompany/NewCompany');
const CompanyUpdated = require('../../core/CompanyUpdated/CompanyUpdated');
const NewOrder = require('../../core/NewOrder/NewOrder');
const TicketUpdated = require('../../core/TicketUpdated/TicketUpdated');
const ActivityUpdated = require('../../core/ActivityUpdated/ActivityUpdated');
const FindTickets = require('../../core/FindTickets/FindTickets');
const CreateTicket = require('../../core/CreateTicket/CreateTicket');
const UpdateTicket = require('../../core/UpdateTicket/UpdateTicket');
const AddTicketComment = require('../../core/AddTicketComment/AddTicketComment');
const UpdateActivity = require('../../core/UpdateActivity/UpdateActivity');

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

describe('upsales Updated triggers: changed fields and previous values', function() {

    const T0 = '2026-11-26T08:00:00.000Z';
    const T1 = '2026-11-26T08:01:00.000Z';
    const T2 = '2026-11-26T08:02:00.000Z';

    const ticket = (modDate, statusId, custom = [{ fieldId: 3, value: 'Invited' }]) => ({
        id: 101, title: 'Login', modDate, status: { id: statusId, name: 'S' + statusId }, custom,
        comments: [{ id: 1, description: 'hi' }]
    });

    it('first sight emits previousKnown false, the next change lists the changed fields and old values', async function() {
        let answer = [ticket(T1, 1)];
        const context = createContext({
            state: { since: T0, boundary: [], emitted: [] },
            responder: async (options) => {
                assert.strictEqual(new URL(options.url).pathname, '/api/v2/tickets');
                return list(answer);
            }
        });
        await TicketUpdated.tick(context);
        assert.strictEqual(context.sent[0].data.previousKnown, false);
        assert.deepStrictEqual(context.sent[0].data.changedFields, []);
        assert.ok(!('comments' in context.state.snapshots['101']), 'comments are not kept in the state');

        answer = [ticket(T2, 3, [{ fieldId: 3, value: 'Answered' }])];
        await TicketUpdated.tick(context);
        const second = context.sent[1].data;
        assert.strictEqual(second.previousKnown, true);
        assert.deepStrictEqual(second.changedFields, ['status', 'custom', 'custom.3']);
        assert.deepStrictEqual(second.previous.status, { id: 1, name: 'S1' });
        assert.deepStrictEqual(second.status, { id: 3, name: 'S3' });
    });

    it('Field + Changed To fires only when the field changes to the value', async function() {
        let answer = [ticket(T1, 1)];
        const context = createContext({
            state: { since: T0, boundary: [], emitted: [] },
            responder: async () => list(answer)
        });
        context.properties = { watchField: 'status.id', watchValue: '3' };

        await TicketUpdated.tick(context); // seen with status 1 - no fire
        answer = [{ ...ticket(T2, 1), title: 'Renamed' }];
        await TicketUpdated.tick(context); // other field changed - no fire
        answer = [ticket('2026-11-26T08:03:00.000Z', 3)];
        await TicketUpdated.tick(context); // 1 -> 3 - fires
        answer = [{ ...ticket('2026-11-26T08:04:00.000Z', 3), title: 'Again' }];
        await TicketUpdated.tick(context); // still 3 - no fire
        assert.strictEqual(context.sent.length, 1);
        assert.strictEqual(context.sent[0].data.status.id, 3);
        assert.deepStrictEqual(context.sent[0].data.previous.status, { id: 1, name: 'S1' });
    });

    it('a record not seen before fires when the watched field already has the value', function() {
        const props = { watchField: 'closeDate', watchValue: '' };
        assert.strictEqual(lib.passesWatch(props, undefined, { closeDate: null }), true);
        assert.strictEqual(lib.passesWatch(props, { closeDate: null }, { closeDate: null }), false);
        assert.strictEqual(lib.passesWatch(props, { closeDate: null }, { closeDate: '2026-11-26' }), true);
        const custom = { watchField: 'custom.3', watchValue: 'Answered' };
        assert.strictEqual(lib.passesWatch(custom, undefined, { custom: [{ fieldId: 3, value: 'Answered' }] }), true);
        assert.strictEqual(lib.passesWatch(custom, undefined, { custom: [{ fieldId: 3, value: 'Invited' }] }), false);
    });

    it('ActivityUpdated reports a task closed by setting its closeDate', async function() {
        let answer = [{ id: 5, modDate: T1, closeDate: null, description: 'Follow up' }];
        const context = createContext({
            state: { since: T0, boundary: [], emitted: [] },
            responder: async (options) => {
                assert.strictEqual(new URL(options.url).pathname, '/api/v2/activities');
                assert.strictEqual(query(options).get('sort'), 'modDate');
                return list(answer);
            }
        });
        await ActivityUpdated.tick(context);
        answer = [{ id: 5, modDate: T2, closeDate: '2026-11-26', description: 'Follow up' }];
        await ActivityUpdated.tick(context);
        assert.deepStrictEqual(context.sent[1].data.changedFields, ['closeDate']);
        assert.deepStrictEqual(context.sent[1].data.previous, { closeDate: null });
    });

    it('keeps at most 300 records in the state, dropping the ones changed longest ago', async function() {
        const items = Array.from({ length: 305 }, (_, i) => ({ id: i + 1, modDate: T1 }));
        const context = createContext({
            state: { since: T0, boundary: [], emitted: [] },
            responder: async () => list(items)
        });
        await ActivityUpdated.tick(context);
        const keys = Object.keys(context.state.snapshots);
        assert.strictEqual(keys.length, 300);
        assert.ok(!keys.includes('1') && keys.includes('305'));
    });

    it('test() emits the latest record with previousKnown false and saves no state', async function() {
        const context = createContext({ responder: async () => list([{ id: 9, modDate: T1 }], 1) });
        context.saveState = async () => assert.fail('test() must not save state');
        await TicketUpdated.test(context);
        assert.deepStrictEqual(context.sent[0].data, {
            id: 9, modDate: T1, changedFields: [], previous: {}, previousKnown: false
        });
    });
});

describe('upsales tickets', function() {

    it('CreateTicket sends the description the API requires', async function() {
        const context = createContext({
            responder: async () => ({ data: { error: null, data: { id: 101 } } }),
            content: { title: 'Login', description: 'Cannot log in', statusId: '1', typeId: '1' }
        });
        await CreateTicket.receive(context);
        assert.deepStrictEqual(context.requests[0].data, {
            title: 'Login', description: 'Cannot log in', status: { id: 1 }, type: { id: 1 }
        });
        const missing = createContext({ responder: async () => ({ data: {} }), content: { title: 'x', statusId: '1', typeId: '1' } });
        await assert.rejects(CreateTicket.receive(missing), CancelError);
    });

    it('FindTickets sends the filters and goes to notFound on an empty result', async function() {
        const context = createContext({
            responder: async () => list([]),
            content: { statusId: '3', companyId: '12', contactId: '340', userId: '5', modifiedAfter: '2026-11-01T00:00:00Z', outputType: 'array' }
        });
        await FindTickets.receive(context);
        const params = query(context.requests[0]);
        assert.strictEqual(params.get('status.id'), '3');
        assert.strictEqual(params.get('client.id'), '12');
        assert.strictEqual(params.get('contact.id'), '340');
        assert.strictEqual(params.get('user.id'), '5');
        assert.strictEqual(params.get('modDate'), 'gte:2026-11-01T00:00:00.000Z');
        assert.strictEqual(context.sent[0].port, 'notFound');
    });

    it('UpdateTicket sends only the filled fields, custom fields included, and returns {}', async function() {
        const context = createContext({
            responder: async () => ({ data: { error: null, data: { id: 101 } } }),
            content: { ticketId: '101', statusId: '3', priority: 2, customFields: '[{"fieldId": 1, "value": "Mobile"}]' }
        });
        await UpdateTicket.receive(context);
        assert.strictEqual(context.requests[0].method, 'PUT');
        assert.strictEqual(new URL(context.requests[0].url).pathname, '/api/v2/tickets/101');
        assert.deepStrictEqual(context.requests[0].data, { status: { id: 3 }, priority: 2, custom: [{ fieldId: 1, value: 'Mobile' }] });
        assert.deepStrictEqual(context.sent[0], { data: {}, port: 'out' });
    });

    it('AddTicketComment requires an author and posts to the comment endpoint as an internal note by default', async function() {
        const context = createContext({
            responder: async () => ({ data: { error: null, data: { id: 41 } } }),
            content: { ticketId: '101', description: 'Survey sent', userId: '8' }
        });
        await AddTicketComment.receive(context);
        assert.strictEqual(context.requests[0].method, 'POST');
        assert.strictEqual(new URL(context.requests[0].url).pathname, '/api/v2/tickets/101/comment');
        assert.deepStrictEqual(context.requests[0].data, { description: 'Survey sent', isPublic: false, user: { id: 8 } });
        const noAuthor = createContext({ responder: async () => ({ data: {} }), content: { ticketId: '101', description: 'x' } });
        await assert.rejects(AddTicketComment.receive(noAuthor), CancelError);
        assert.strictEqual(noAuthor.requests.length, 0);
    });
});

describe('upsales UpdateActivity', function() {

    it('sends activity custom fields', async function() {
        const context = createContext({
            responder: async () => ({ data: { error: null, data: { id: 5 } } }),
            content: { activityId: '5', customFields: [{ fieldId: 2, value: 'INV-1' }] }
        });
        await UpdateActivity.receive(context);
        assert.deepStrictEqual(context.requests[0].data, { custom: [{ fieldId: 2, value: 'INV-1' }] });
    });
});
