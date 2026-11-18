'use strict';

const assert = require('assert');

const lib = require('../../lib');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const CreateTimeEntry = require('../../core/CreateTimeEntry/CreateTimeEntry');
const GetTimeEntry = require('../../core/GetTimeEntry/GetTimeEntry');
const NewTimeEntry = require('../../core/NewTimeEntry/NewTimeEntry');
const NewTimeEntryPolling = require('../../core/NewTimeEntryPolling/NewTimeEntryPolling');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

const createContext = ({ content = {}, properties = {}, state = {}, responses = [] } = {}) => {

    const context = {
        auth: { apiToken: 'tok123' },
        config: {},
        properties,
        state: { ...state },
        componentId: 'component-1',
        flowId: 'flow-1',
        messages: { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        responded: [],
        cache: {},
        async httpRequest(options) {
            this.requests.push(options);
            const next = responses.length ? responses.shift() : { data: {} };
            return { status: 200, headers: {}, ...next };
        },
        async sendJson(data, port) {
            this.sent.push({ data, port });
        },
        async response(body, status = 200, headers) {
            this.responded.push({ body, status, headers });
        },
        async log() {},
        async lock() {
            return { unlock() {} };
        },
        staticCache: {
            get: async key => context.cache[key],
            set: async (key, value) => {
                context.cache[key] = value;
            }
        },
        async loadState() {
            return this.state;
        },
        async saveState(state) {
            this.state = { ...state };
        },
        async stateSet(key, value) {
            this.state[key] = value;
        },
        getWebhookUrl() {
            return 'https://api.appmixer.example/flows/flow-1/components/component-1';
        }
    };
    return context;
};

describe('Toggl Track', function() {

    describe('lib', function() {

        it('authenticates with Basic <token>:api_token', function() {
            const header = lib.authHeaders('tok123').Authorization;
            assert.strictEqual(header, 'Basic ' + Buffer.from('tok123:api_token').toString('base64'));
        });

        it('rejects IDs that are not numeric, so they cannot change the URL path', function() {
            const context = createContext();
            assert.throws(() => lib.requireId(context, '12/../../me', 'Time Entry ID'), /numeric/);
            assert.strictEqual(lib.requireId(context, 42, 'Time Entry ID'), '42');
        });

        it('formats times without fractions in UTC', function() {
            const context = createContext();
            assert.strictEqual(lib.toTogglTime(context, '2026-11-18T10:30:00.123+01:00', 'Start'), '2026-11-18T09:30:00Z');
            assert.strictEqual(lib.toDateOnly(context, '2026-11-18', 'Start Date'), '2026-11-18');
        });
    });

    describe('MakeApiCall', function() {

        it('resolves a relative path against the Track API v9', async function() {
            const context = createContext({ content: { url: '/me/workspaces', method: 'GET' } });
            await MakeApiCall.receive(context);
            assert.strictEqual(context.requests[0].url, 'https://api.track.toggl.com/api/v9/me/workspaces');
        });

        it('accepts a full URL of the Reports API on the Toggl host', async function() {
            const url = 'https://api.track.toggl.com/reports/api/v3/workspace/1/search/time_entries';
            const context = createContext({ content: { url, method: 'POST', body: '{"start_date":"2026-11-01"}' } });
            await MakeApiCall.receive(context);
            assert.strictEqual(context.requests[0].url, url);
            assert.deepStrictEqual(context.requests[0].data, { start_date: '2026-11-01' });
        });

        for (const url of ['https://evil.example/x', '//evil.example/x', 'https://user:pw@api.track.toggl.com/api/v9/me']) {
            it(`refuses ${url} and makes no request`, async function() {
                const context = createContext({ content: { url, method: 'GET' } });
                await assert.rejects(() => MakeApiCall.receive(context), CancelError);
                assert.strictEqual(context.requests.length, 0);
            });
        }

        it('sends the key-value headers and parameters the Designer stores and keeps its own Authorization', async function() {
            const context = createContext({
                content: {
                    url: '/me',
                    method: 'GET',
                    headers: '{"Accept":"application/json","Authorization":"Basic other"}',
                    parameters: '{"with_related_data":"true"}'
                }
            });
            await MakeApiCall.receive(context);
            const request = context.requests[0];
            assert.strictEqual(request.headers.Accept, 'application/json');
            assert.strictEqual(request.headers.Authorization, lib.authHeaders('tok123').Authorization);
            assert.deepStrictEqual(request.params, { with_related_data: 'true' });
        });
    });

    describe('CreateTimeEntry', function() {

        it('starts a running timer when neither Stop nor Duration is set', async function() {
            const context = createContext({
                content: { workspaceId: '123', start: '2026-11-18T09:00:00Z', description: 'Work', tags: 'a, b' },
                responses: [{ data: { id: 1 } }]
            });
            await CreateTimeEntry.receive(context);
            const { url, data } = context.requests[0];
            assert.strictEqual(url, 'https://api.track.toggl.com/api/v9/workspaces/123/time_entries');
            assert.strictEqual(data.duration, -1);
            assert.strictEqual(data.created_with, 'Appmixer');
            assert.strictEqual(data.workspace_id, 123);
            assert.deepStrictEqual(data.tags, ['a', 'b']);
            assert.deepStrictEqual(context.sent[0], { data: { id: 1 }, port: 'out' });
        });

        it('sends a duration that agrees with Start and Stop', async function() {
            const context = createContext({
                content: { workspaceId: '123', start: '2026-11-18T09:00:00Z', stop: '2026-11-18T10:30:00Z' },
                responses: [{ data: { id: 1 } }]
            });
            await CreateTimeEntry.receive(context);
            assert.strictEqual(context.requests[0].data.duration, 5400);
            assert.strictEqual(context.requests[0].data.stop, '2026-11-18T10:30:00Z');
        });

        it('uses the default workspace of the account when none is picked', async function() {
            const context = createContext({
                content: { start: '2026-11-18T09:00:00Z' },
                responses: [{ data: { default_workspace_id: 777 } }, { data: { id: 1 } }]
            });
            await CreateTimeEntry.receive(context);
            assert.strictEqual(context.requests[0].url, 'https://api.track.toggl.com/api/v9/me');
            assert.strictEqual(context.requests[1].url, 'https://api.track.toggl.com/api/v9/workspaces/777/time_entries');
        });
    });

    describe('GetTimeEntry', function() {

        it('requires the time entry ID', async function() {
            const context = createContext({ content: {} });
            await assert.rejects(() => GetTimeEntry.receive(context), /Time Entry ID is required!/);
            assert.strictEqual(context.requests.length, 0);
        });
    });

    describe('NewTimeEntry (webhook)', function() {

        const delivery = (context, data, token) => {
            context.messages = { webhook: { content: { data, query: { token } } } };
        };

        it('creates a subscription with a token in the callback URL', async function() {
            const context = createContext({
                properties: { workspaceId: '123' },
                responses: [{ data: { subscription_id: 9, validated_at: null } }]
            });
            await NewTimeEntry.start(context);
            const { url, data } = context.requests[0];
            assert.strictEqual(url, 'https://api.track.toggl.com/webhooks/api/v1/subscriptions/123');
            assert.deepStrictEqual(data.event_filters, [{ entity: 'time_entry', action: 'created' }]);
            assert.ok(data.url_callback.endsWith('?token=' + context.state.token));
            assert.strictEqual(context.state.subscriptionId, 9);
        });

        it('rejects a delivery without the token', async function() {
            const context = createContext({ state: { token: 'secret-token', subscriptionId: 9, workspaceId: '123' } });
            delivery(context, { subscription_id: 9, payload: { id: 1 } }, 'wrong');
            await NewTimeEntry.receive(context);
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.responded[0].status, 403);
        });

        it('answers the validation PING with its code', async function() {
            const context = createContext({ state: { token: 'secret-token', subscriptionId: 9, workspaceId: '123' } });
            delivery(context, { subscription_id: 9, payload: 'ping', validation_code: 'abc' }, 'secret-token');
            await NewTimeEntry.receive(context);
            assert.deepStrictEqual(context.responded[0].body, { validation_code: 'abc' });
            assert.strictEqual(context.requests[0].url, 'https://api.track.toggl.com/webhooks/api/v1/validate/123/9/abc');
            assert.strictEqual(context.state.validated, true);
            assert.strictEqual(context.sent.length, 0);
        });

        it('emits the time entry of an event once, even when Toggl retries it', async function() {
            const context = createContext({ state: { token: 'secret-token', subscriptionId: 9, workspaceId: '123' } });
            const event = {
                event_id: 55,
                subscription_id: 9,
                metadata: { model: 'time_entry', action: 'created' },
                payload: { id: 1, description: 'Work' }
            };
            delivery(context, event, 'secret-token');
            await NewTimeEntry.receive(context);
            delivery(context, event, 'secret-token');
            await NewTimeEntry.receive(context);
            assert.deepStrictEqual(context.sent, [{ data: { id: 1, description: 'Work' }, port: 'out' }]);
        });

        it('pings an unvalidated subscription from tick()', async function() {
            const context = createContext({
                state: { token: 't', subscriptionId: 9, workspaceId: '123' },
                responses: [{ data: [{ subscription_id: 9, validated_at: null }] }, { data: { status: 'ok' } }]
            });
            await NewTimeEntry.tick(context);
            assert.strictEqual(context.requests[1].method, 'POST');
            assert.strictEqual(context.requests[1].url, 'https://api.track.toggl.com/webhooks/api/v1/ping/123/9');
        });
    });

    describe('NewTimeEntryPolling', function() {

        it('records a baseline first, then emits only new entries', async function() {
            const first = createContext({ responses: [{ data: [{ id: 1, start: '2026-11-18T08:00:00Z' }] }] });
            await NewTimeEntryPolling.tick(first);
            assert.strictEqual(first.sent.length, 0);
            assert.deepStrictEqual(first.state.known, [1]);

            const second = createContext({
                state: { known: [1], lastPoll: Date.now() - 10 * 60 * 1000 },
                responses: [{ data: [{ id: 2, start: '2026-11-18T09:00:00Z' }, { id: 1, start: '2026-11-18T08:00:00Z' }] }]
            });
            await NewTimeEntryPolling.tick(second);
            assert.deepStrictEqual(second.sent.map(item => item.data.id), [2]);
            assert.deepStrictEqual(second.state.known, [2, 1]);
        });

        it('keeps the known entries when the answer is empty', async function() {
            const context = createContext({
                state: { known: [1, 2], lastPoll: Date.now() - 10 * 60 * 1000 },
                responses: [{ data: [] }]
            });
            await NewTimeEntryPolling.tick(context);
            assert.deepStrictEqual(context.state.known, [1, 2]);

            context.state.lastPoll = Date.now() - 10 * 60 * 1000;
            context.httpRequest = async () => ({ data: [{ id: 2 }, { id: 1 }] });
            await NewTimeEntryPolling.tick(context);
            assert.strictEqual(context.sent.length, 0);
        });

        it('does not call Toggl again within the polling interval', async function() {
            const context = createContext({ state: { known: [1], lastPoll: Date.now() - 60 * 1000 } });
            await NewTimeEntryPolling.tick(context);
            assert.strictEqual(context.requests.length, 0);
        });
    });
});
