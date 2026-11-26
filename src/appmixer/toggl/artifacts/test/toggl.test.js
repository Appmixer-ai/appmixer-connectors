'use strict';

const assert = require('assert');

const lib = require('../../lib');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const CreateTimeEntry = require('../../core/CreateTimeEntry/CreateTimeEntry');
const UpdateTimeEntry = require('../../core/UpdateTimeEntry/UpdateTimeEntry');
const GetTimeEntry = require('../../core/GetTimeEntry/GetTimeEntry');
const StopTimeEntry = require('../../core/StopTimeEntry/StopTimeEntry');
const GetCurrentTimeEntry = require('../../core/GetCurrentTimeEntry/GetCurrentTimeEntry');
const FindReportTimeEntries = require('../../core/FindReportTimeEntries/FindReportTimeEntries');
const NewTimeEntry = require('../../core/NewTimeEntry/NewTimeEntry');
const TimeEntryUpdated = require('../../core/TimeEntryUpdated/TimeEntryUpdated');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

const BASE = 'https://focus.toggl.com/api';
const WORKSPACE = `${BASE}/organizations/11/workspaces/22`;

// A response of an Error makes httpRequest reject with it.
const createContext = ({ content = {}, properties = {}, state = {}, responses = [], auth } = {}) => {

    const context = {
        auth: auth || { apiKey: 'toggl_sk_test', organizationId: '11', workspaceId: '22' },
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
            return { unlock() {} };
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

const httpError = (status, data) => Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data, headers: {} }
});

const LONG_AGO = Date.now() - 10 * 60 * 1000;

describe('Toggl', function() {

    describe('lib', function() {

        it('authenticates with the API key as a Bearer token, trimmed', function() {
            assert.strictEqual(lib.authHeaders(' toggl_sk_abc\n').Authorization, 'Bearer toggl_sk_abc');
        });

        it('rejects IDs that are not numeric, so they cannot change the URL path', function() {
            const context = createContext();
            assert.throws(() => lib.requireId(context, '12/../../users', 'Time Entry ID'), /numeric/);
            assert.strictEqual(lib.requireId(context, 42, 'Time Entry ID'), '42');
        });

        it('formats times in UTC and keeps a typed calendar date', function() {
            const context = createContext();
            assert.strictEqual(lib.toTogglTime(context, '2026-11-18T10:30:00+01:00', 'Start'), '2026-11-18T09:30:00.000Z');
            assert.strictEqual(lib.toDateOnly(context, '2026-11-18', 'Start Date'), '2026-11-18');
        });

        it('uses the organization and workspace of the account when it names them', async function() {
            const context = createContext();
            assert.deepStrictEqual(await lib.resolveScope(context), { organizationId: '11', workspaceId: '22' });
            assert.strictEqual(context.requests.length, 0);
        });

        it('looks up the default workspace once and caches it', async function() {
            const context = createContext({
                auth: { apiKey: 'toggl_sk_test' },
                responses: [{ data: { organization_id: 5, workspace_id: 6, reason: 'default' } }]
            });
            assert.deepStrictEqual(await lib.resolveScope(context), { organizationId: '5', workspaceId: '6' });
            assert.deepStrictEqual(await lib.resolveScope(context), { organizationId: '5', workspaceId: '6' });
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.requests[0].url, `${BASE}/users/me/landing-workspace`);
        });

        it('adds stop to a finished entry and drops null fields', function() {
            const entry = lib.toTimeEntry({ id: 1, start: '2026-11-18T09:00:00Z', duration: 5400, project_id: null, tags: [] });
            assert.deepStrictEqual(entry, { id: 1, start: '2026-11-18T09:00:00Z', duration: 5400, stop: '2026-11-18T10:30:00.000Z' });
            assert.strictEqual(lib.toTimeEntry({ id: 2, start: '2026-11-18T09:00:00Z' }).stop, undefined);
        });
    });

    describe('CSV output', function() {

        it('names the columns of all records, not only of the first one', async function() {
            const context = createContext();
            context.flowDescriptor = { 'component-1': { label: 'Find Time Entries' } };
            let csv;
            context.saveFileStream = async (name, buffer) => {
                csv = buffer.toString('utf8');
                return { fileId: 'file-1' };
            };
            await lib.sendArrayOutput({
                context,
                outputType: 'file',
                records: [
                    { id: 1, description: 'running', start: '2026-11-18T08:00:00Z' },
                    { id: 2, description: 'done, "billed"', start: '2026-11-18T07:00:00Z', duration: 600, project_id: 5 }
                ]
            });
            assert.strictEqual(csv, [
                'id,description,start,duration,project_id',
                '1,running,2026-11-18T08:00:00Z,,',
                '2,"done, ""billed""",2026-11-18T07:00:00Z,600,5'
            ].join('\n'));
            assert.deepStrictEqual(context.sent[0], { data: { fileId: 'file-1' }, port: 'out' });
        });
    });

    describe('MakeApiCall', function() {

        it('resolves a relative path against the Toggl API', async function() {
            const context = createContext({ content: { url: '/users/me/settings', method: 'GET' } });
            await MakeApiCall.receive(context);
            assert.strictEqual(context.requests[0].url, `${BASE}/users/me/settings`);
        });

        it('accepts a full URL on the Toggl host', async function() {
            const url = `${BASE}/reports/workspaces/22/query`;
            const context = createContext({ content: { url, method: 'POST', body: '{"attributes":[]}' } });
            await MakeApiCall.receive(context);
            assert.strictEqual(context.requests[0].url, url);
            assert.deepStrictEqual(context.requests[0].data, { attributes: [] });
        });

        for (const url of ['https://evil.example/x', '//evil.example/x', 'https://user:pw@focus.toggl.com/api/users/me/settings', 'https://api.track.toggl.com/api/v9/me']) {
            it(`refuses ${url} and makes no request`, async function() {
                const context = createContext({ content: { url, method: 'GET' } });
                await assert.rejects(() => MakeApiCall.receive(context), CancelError);
                assert.strictEqual(context.requests.length, 0);
            });
        }

        it('sends the key-value headers and parameters the Designer stores and keeps its own Authorization', async function() {
            const context = createContext({
                content: {
                    url: '/workspaces/22/tags',
                    method: 'GET',
                    headers: '{"Accept":"application/json","Authorization":"Bearer other"}',
                    parameters: '{"per_page":"5"}'
                }
            });
            await MakeApiCall.receive(context);
            const request = context.requests[0];
            assert.strictEqual(request.headers.Accept, 'application/json');
            assert.strictEqual(request.headers.Authorization, 'Bearer toggl_sk_test');
            assert.deepStrictEqual(request.params, { per_page: '5' });
        });
    });

    describe('CreateTimeEntry', function() {

        it('starts a running timer when neither Stop nor Duration is set', async function() {
            const context = createContext({
                content: { description: 'Work', projectId: '7', tagIds: '3, 4' },
                responses: [{ data: { id: 1, start: '2026-11-18T09:00:00Z' } }]
            });
            await CreateTimeEntry.receive(context);
            const { url, data } = context.requests[0];
            assert.strictEqual(url, `${WORKSPACE}/tracking/start`);
            assert.deepStrictEqual(data, { type: 'activity', description: 'Work', tag_ids: [3, 4], project_id: 7 });
            assert.deepStrictEqual(context.sent[0], { data: { id: 1, start: '2026-11-18T09:00:00Z' }, port: 'out' });
        });

        it('turns Start and Stop into a duration', async function() {
            const context = createContext({
                content: { start: '2026-11-18T09:00:00Z', stop: '2026-11-18T10:30:00Z', projectId: '7' },
                responses: [{ data: { id: 1 } }]
            });
            await CreateTimeEntry.receive(context);
            const { url, data } = context.requests[0];
            assert.strictEqual(url, `${WORKSPACE}/time-entries`);
            assert.strictEqual(data.duration, 5400);
            assert.strictEqual(data.project_id, 7);
            assert.strictEqual(data.stop, undefined);
        });

        it('creates an entry of a task under the task', async function() {
            const context = createContext({
                content: { start: '2026-11-18T09:00:00Z', duration: 600, taskId: '9', projectId: '7' },
                responses: [{ data: { id: 1 } }]
            });
            await CreateTimeEntry.receive(context);
            assert.strictEqual(context.requests[0].url, `${WORKSPACE}/tasks/9/time-entries`);
            assert.strictEqual(context.requests[0].data.project_id, undefined);
        });

        it('requires Start for a finished entry and refuses a Stop before Start', async function() {
            const noStart = createContext({ content: { duration: 600 } });
            await assert.rejects(() => CreateTimeEntry.receive(noStart), /Start is required/);
            const backwards = createContext({ content: { start: '2026-11-18T10:00:00Z', stop: '2026-11-18T09:00:00Z' } });
            await assert.rejects(() => CreateTimeEntry.receive(backwards), /Stop must be after Start/);
            assert.strictEqual(noStart.requests.length + backwards.requests.length, 0);
        });
    });

    describe('UpdateTimeEntry', function() {

        it('reads the current Start to turn a new Stop into a duration, and returns an empty object', async function() {
            const context = createContext({
                content: { timeEntryId: '5', stop: '2026-11-18T10:00:00Z', billable: 'false' },
                responses: [{ data: { id: 5, start: '2026-11-18T09:00:00Z' } }, { data: '' }]
            });
            await UpdateTimeEntry.receive(context);
            assert.strictEqual(context.requests[1].method, 'PATCH');
            assert.strictEqual(context.requests[1].url, `${WORKSPACE}/time-entries/5`);
            assert.deepStrictEqual(context.requests[1].data, { duration: 3600, billable: false });
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'out' });
        });

        it('refuses an update without any field', async function() {
            const context = createContext({ content: { timeEntryId: '5' } });
            await assert.rejects(() => UpdateTimeEntry.receive(context), /at least one field/);
        });
    });

    describe('GetTimeEntry', function() {

        it('requires the time entry ID', async function() {
            const context = createContext({ content: {} });
            await assert.rejects(() => GetTimeEntry.receive(context), /Time Entry ID is required!/);
            assert.strictEqual(context.requests.length, 0);
        });
    });

    describe('running timer', function() {

        it('Get Current Time Entry goes to notFound on the empty 204 answer', async function() {
            const context = createContext({ responses: [{ status: 204, data: '' }] });
            await GetCurrentTimeEntry.receive(context);
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'notFound' });
        });

        it('Stop Time Entry goes to notFound when no timer is running', async function() {
            const context = createContext({
                responses: [httpError(400, { error: 'invalid_timeentry', error_description: 'User is not tracking time' })]
            });
            await StopTimeEntry.receive(context);
            assert.strictEqual(context.requests[0].url, `${WORKSPACE}/tracking/stop`);
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'notFound' });
        });

        it('Stop Time Entry does not hide another 400', async function() {
            const context = createContext({
                responses: [httpError(400, { error: 'invalid_timeentry', error_description: 'Time entry end time must be after start time' })]
            });
            await assert.rejects(() => StopTimeEntry.receive(context), /status code 400/);
        });
    });

    describe('FindReportTimeEntries', function() {

        it('queries the report with filters and computes stop in UTC', async function() {
            const context = createContext({
                content: { startDate: '2026-11-17', endDate: '2026-11-19T00:00:00Z', description: 'cli', projectIds: '7,8', outputType: 'array' },
                responses: [{
                    data: {
                        data_json_row: [{
                            time_entry_id: 1,
                            start_utc: '2026-11-18T08:00:00+00:00',
                            duration: 600,
                            project_id: 0,
                            project_name: null
                        }]
                    }
                }]
            });
            await FindReportTimeEntries.receive(context);
            const { url, params, data } = context.requests[0];
            assert.strictEqual(url, `${BASE}/reports/workspaces/22/query`);
            assert.deepStrictEqual(params, { response_format: 'json_row' });
            assert.deepStrictEqual(data.period, { from: '2026-11-17', to: '2026-11-19' });
            assert.deepStrictEqual(data.filters, [
                { property: 'description', operator: 'contains', value: 'cli' },
                { property: 'project_id', operator: 'in', value: [7, 8] }
            ]);
            assert.ok(!data.attributes.some(attribute => attribute.property === 'stop'));
            assert.deepStrictEqual(context.sent[0].data.result, [{
                time_entry_id: 1,
                start_utc: '2026-11-18T08:00:00+00:00',
                duration: 600,
                stop: '2026-11-18T08:10:00.000Z'
            }]);
        });

        it('goes to notFound when the report is empty', async function() {
            const context = createContext({
                content: { startDate: '2026-11-17', endDate: '2026-11-19', outputType: 'array' },
                responses: [{ data: { data_json_row: [] } }]
            });
            await FindReportTimeEntries.receive(context);
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'notFound' });
        });
    });

    describe('polling triggers', function() {

        const page = entries => ({ data: { page: 1, per_page: 100, data: entries } });
        const entry = (id, createdAt, updatedAt = createdAt) => ({
            id, workspace_id: 22, type: 'activity', created_at: createdAt, updated_at: updatedAt
        });

        it('records a baseline first, then emits only newer entries, oldest first', async function() {
            const context = createContext({ responses: [page([entry(1, '2026-11-18T08:00:00Z')])] });
            await NewTimeEntry.tick(context);
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.state.initialized, true);
            assert.strictEqual(context.requests[0].params.order_by, '-created_at');
            assert.strictEqual(context.requests[0].params.include_taskless, true);

            context.state.lastPoll = LONG_AGO;
            context.httpRequest = async () => page([
                entry(3, '2026-11-18T10:00:00Z'),
                entry(2, '2026-11-18T09:00:00Z'),
                entry(1, '2026-11-18T08:00:00Z')
            ]);
            await NewTimeEntry.tick(context);
            assert.deepStrictEqual(context.sent.map(item => item.data.id), [2, 3]);
        });

        it('emits the first entry ever of an empty account', async function() {
            const context = createContext({ responses: [page([])] });
            await NewTimeEntry.tick(context);
            assert.strictEqual(context.state.initialized, true);

            context.state.lastPoll = LONG_AGO;
            context.httpRequest = async () => page([entry(1, '2026-11-18T08:00:00Z')]);
            await NewTimeEntry.tick(context);
            assert.deepStrictEqual(context.sent.map(item => item.data.id), [1]);
        });

        it('emits an entry written in the same instant as the last one seen, once', async function() {
            const context = createContext({ responses: [page([entry(1, '2026-11-18T08:00:00Z')])] });
            await NewTimeEntry.tick(context);

            const both = page([entry(2, '2026-11-18T08:00:00Z'), entry(1, '2026-11-18T08:00:00Z')]);
            context.httpRequest = async () => both;
            context.state.lastPoll = LONG_AGO;
            await NewTimeEntry.tick(context);
            context.state.lastPoll = LONG_AGO;
            await NewTimeEntry.tick(context);
            assert.deepStrictEqual(context.sent.map(item => item.data.id), [2]);
        });

        it('reads past the first page until it reaches the last entry seen', async function() {
            const context = createContext({ responses: [page([entry(1, '2026-11-18T08:00:00Z')])] });
            await NewTimeEntry.tick(context);
            assert.strictEqual(context.requests[0].params.page, 1);
            assert.strictEqual(context.requests.length, 1);

            // 150 entries imported at once: ids 151..2, newest first, then the entry of the baseline.
            const minute = index => new Date(Date.parse('2026-11-18T09:00:00Z') + index * 60000).toISOString();
            const imported = [];
            for (let id = 151; id >= 2; id--) {
                imported.push(entry(id, minute(id)));
            }
            const pages = [
                page(imported.slice(0, 100)),
                page([...imported.slice(100), entry(1, '2026-11-18T08:00:00Z')])
            ];
            context.requests = [];
            context.httpRequest = async function(options) {
                this.requests.push(options);
                return pages.shift();
            };
            context.state.lastPoll = LONG_AGO;
            await NewTimeEntry.tick(context);
            assert.deepStrictEqual(context.requests.map(item => item.params.page), [1, 2]);
            assert.strictEqual(context.sent.length, 150);
            assert.strictEqual(context.sent[0].data.id, 2);
            assert.strictEqual(context.sent[149].data.id, 151);
        });

        it('stops at the first page when it already holds the last entry seen', async function() {
            const full = [];
            for (let id = 100; id >= 1; id--) {
                full.push(entry(id, new Date(Date.parse('2026-11-18T08:00:00Z') + id * 60000).toISOString()));
            }
            const context = createContext({
                state: { initialized: true, lastTimestamp: new Date(full[1].created_at).getTime(), known: ['99'], lastPoll: LONG_AGO },
                responses: [page(full)]
            });
            await NewTimeEntry.tick(context);
            assert.strictEqual(context.requests.length, 1);
            assert.deepStrictEqual(context.sent.map(item => item.data.id), [100]);
        });

        it('keeps its position when the answer is empty', async function() {
            const context = createContext({
                state: { initialized: true, lastTimestamp: new Date('2026-11-18T08:00:00Z').getTime(), known: ['1'], lastPoll: LONG_AGO },
                responses: [page([])]
            });
            await NewTimeEntry.tick(context);
            context.state.lastPoll = LONG_AGO;
            context.httpRequest = async () => page([entry(1, '2026-11-18T08:00:00Z')]);
            await NewTimeEntry.tick(context);
            assert.strictEqual(context.sent.length, 0);
        });

        it('does not call Toggl again within the polling interval', async function() {
            const context = createContext({ state: { initialized: true, lastPoll: Date.now() - 60 * 1000 } });
            await NewTimeEntry.tick(context);
            assert.strictEqual(context.requests.length, 0);
        });

        it('Time Entry Updated fires again for each change and not for a creation', async function() {
            const context = createContext({ responses: [page([entry(1, '2026-11-18T08:00:00Z')])] });
            await TimeEntryUpdated.tick(context);
            assert.strictEqual(context.requests[0].params.order_by, '-updated_at');

            const answers = [
                page([entry(2, '2026-11-18T09:00:00Z'), entry(1, '2026-11-18T08:00:00Z', '2026-11-18T08:30:00Z')]),
                page([entry(1, '2026-11-18T08:00:00Z', '2026-11-18T09:30:00Z'), entry(2, '2026-11-18T09:00:00Z')])
            ];
            context.httpRequest = async () => answers.shift();
            context.state.lastPoll = LONG_AGO;
            await TimeEntryUpdated.tick(context);
            context.state.lastPoll = LONG_AGO;
            await TimeEntryUpdated.tick(context);
            assert.deepStrictEqual(context.sent.map(item => item.data.updated_at), ['2026-11-18T08:30:00Z', '2026-11-18T09:30:00Z']);
        });
    });
});
