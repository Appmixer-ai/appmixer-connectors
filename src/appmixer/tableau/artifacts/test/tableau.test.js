'use strict';

const assert = require('assert');
const lib = require('../../lib');
const auth = require('../../auth');
const FindWorkbooks = require('../../core/FindWorkbooks/FindWorkbooks');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const RefreshWorkbookExtract = require('../../core/RefreshWorkbookExtract/RefreshWorkbookExtract');
const JobFinished = require('../../core/JobFinished/JobFinished');
const NewWorkbook = require('../../core/NewWorkbook/NewWorkbook');

const AUTH = {
    serverUrl: 'https://10ay.online.tableau.com',
    siteContentUrl: 'mysite',
    tokenName: 'appmixer',
    tokenSecret: 'secret'
};

function signInResponse(token) {

    return { data: { credentials: { token, site: { id: 'site-1', contentUrl: 'mysite' }, user: { id: 'user-1' } } } };
}

function createContext({ handler, content, properties = {}, state = {} } = {}) {

    const cache = new Map();
    const context = {
        auth: { ...AUTH },
        properties,
        state,
        componentId: 'component-1',
        messages: content ? { in: { content } } : {},
        requests: [],
        sent: [],
        timeouts: [],
        savedState: null,
        CancelError: class CancelError extends Error {},
        staticCache: {
            get: async key => cache.get(key),
            set: async (key, value) => { cache.set(key, value); }
        },
        lock: async () => ({ unlock: async () => {} }),
        log: async () => {},
        httpRequest: async options => {
            context.requests.push(options);
            return handler(options, context);
        },
        sendJson: async (data, port) => { context.sent.push({ data, port }); },
        setTimeout: async (data, ms) => { context.timeouts.push({ data, ms }); },
        saveState: async value => { context.savedState = value; },
        getWebhookUrl: () => 'https://api.appmixer.example/flows/1/components/component-1'
    };
    return context;
}

function httpError(status, data) {

    const err = new Error('Request failed with status code ' + status);
    err.response = { status, data };
    return err;
}

describe('tableau', function() {

    describe('server URL in the request host', function() {

        it('accepts the origin of an https URL only', function() {

            assert.strictEqual(lib.serverOrigin('https://10ay.online.tableau.com/#/site/mysite'), 'https://10ay.online.tableau.com');
            assert.throws(() => lib.serverOrigin('http://tableau.example.com'));
            assert.throws(() => lib.serverOrigin('https://user:pass@tableau.example.com'));
            assert.throws(() => lib.serverOrigin('evil.example/x?'));
        });

        it('makes no request when the server URL or the site is invalid', async function() {

            for (const invalid of [{ serverUrl: 'http://evil.example' }, { siteContentUrl: 'a/../b?x=' }]) {
                const context = createContext({ handler: () => assert.fail('no request expected') });
                await assert.rejects(auth.definition.validate({ ...context, ...AUTH, ...invalid }));
                assert.strictEqual(context.requests.length, 0);
            }
        });
    });

    describe('session', function() {

        it('signs in once and reuses the session for the next requests', async function() {

            const handler = options => {
                if (options.url.endsWith('/auth/signin')) return signInResponse('token-1');
                assert.strictEqual(options.headers['X-Tableau-Auth'], 'token-1');
                return { data: { workbook: { id: 'wb-1' } } };
            };
            const context = createContext({ handler });
            await lib.apiRequest(context, { path: '/workbooks/wb-1' });
            await lib.apiRequest(context, { path: '/workbooks/wb-1' });
            const signIns = context.requests.filter(r => r.url.endsWith('/auth/signin'));
            assert.strictEqual(signIns.length, 1);
            assert.strictEqual(context.requests[1].url, 'https://10ay.online.tableau.com/api/3.19/sites/site-1/workbooks/wb-1');
        });

        it('signs in again once when the session was ended', async function() {

            let signIns = 0;
            const handler = options => {
                if (options.url.endsWith('/auth/signin')) {
                    signIns += 1;
                    return signInResponse('token-' + signIns);
                }
                if (options.headers['X-Tableau-Auth'] === 'token-1') {
                    throw httpError(401, { error: { code: '401002', summary: 'Unauthorized Access' } });
                }
                return { data: { ok: true } };
            };
            const context = createContext({ handler });
            const { data } = await lib.apiRequest(context, { path: '/jobs' });
            assert.deepStrictEqual(data, { ok: true });
            assert.strictEqual(signIns, 2);
        });
    });

    describe('FindWorkbooks', function() {

        it('builds the filter and maps the items', async function() {

            const handler = options => {
                if (options.url.endsWith('/auth/signin')) return signInResponse('token-1');
                assert.strictEqual(options.params.filter, 'projectName:eq:Finance,updatedAt:gte:2026-11-01T00:00:00Z');
                assert.strictEqual(options.params.pageSize, 1000);
                return { data: {
                    pagination: { pageNumber: '1', pageSize: '1000', totalAvailable: '1' },
                    workbooks: { workbook: [{ id: 'wb-1', name: 'Sales', size: '2', showTabs: 'true', project: { id: 'p-1', name: 'Finance' }, tags: { tag: [{ label: 'q4' }] } }] }
                } };
            };
            const context = createContext({ handler, content: { projectName: 'Finance', updatedAfter: '2026-11-01T00:00:00.000Z', outputType: 'array' } });
            context.properties = {};
            await FindWorkbooks.receive(context);
            const [{ data, port }] = context.sent;
            assert.strictEqual(port, 'out');
            assert.deepStrictEqual(data.result[0], { id: 'wb-1', name: 'Sales', size: 2, showTabs: true, projectId: 'p-1', projectName: 'Finance', tags: ['q4'] });
        });

        it('rejects filter values Tableau cannot express', async function() {

            const context = createContext({ handler: () => assert.fail('no request expected'), content: { name: 'a,b', outputType: 'array' } });
            await assert.rejects(FindWorkbooks.receive(context), /must not contain/);
        });
    });

    describe('MakeApiCall', function() {

        it('refuses a host other than the connected server', async function() {

            const context = createContext({
                handler: options => (options.url.endsWith('/auth/signin') ? signInResponse('token-1') : assert.fail('no request expected')),
                content: { url: 'https://evil.example/api/3.19/sites', method: 'GET' }
            });
            await assert.rejects(MakeApiCall.receive(context), /must target/);
            const protocolRelative = createContext({
                handler: options => (options.url.endsWith('/auth/signin') ? signInResponse('token-1') : assert.fail('no request expected')),
                content: { url: '//evil.example/x', method: 'GET' }
            });
            await assert.rejects(MakeApiCall.receive(protocolRelative), /must target/);
        });

        it('replaces {site-id} and passes key-value inputs as the Designer stores them', async function() {

            const context = createContext({
                handler: options => {
                    if (options.url.endsWith('/auth/signin')) return signInResponse('token-1');
                    assert.strictEqual(options.url, 'https://10ay.online.tableau.com/api/3.19/sites/site-1/projects');
                    assert.deepStrictEqual(options.params, { pageSize: '5' });
                    assert.strictEqual(options.headers['X-Custom'], 'yes');
                    return { status: 200, headers: {}, data: { projects: {} } };
                },
                content: { url: '/sites/{site-id}/projects', method: 'GET', parameters: '{"pageSize":"5"}', headers: '{"X-Custom":"yes"}' }
            });
            await MakeApiCall.receive(context);
            assert.strictEqual(context.sent[0].data.statusCode, 200);
        });
    });

    describe('RefreshWorkbookExtract', function() {

        it('waits for the job and emits it when it has finished', async function() {

            let polls = 0;
            const handler = options => {
                if (options.url.endsWith('/auth/signin')) return signInResponse('token-1');
                if (options.method === 'POST') return { data: { job: { id: 'job-1', type: 'RefreshExtract', createdAt: '2026-11-17T10:00:00Z' } } };
                polls += 1;
                return { data: { job: polls === 1
                    ? { id: 'job-1', progress: '50' }
                    : { id: 'job-1', progress: '100', finishCode: '0', completedAt: '2026-11-17T10:03:00Z' } } };
            };
            const context = createContext({ handler, content: { workbookId: 'wb-1' } });
            await RefreshWorkbookExtract.receive(context);
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.timeouts.length, 1);
            assert(context.timeouts[0].ms >= 60000);

            for (let i = 0; i < 2; i++) {
                context.messages = { timeout: { content: context.timeouts[context.timeouts.length - 1].data } };
                await RefreshWorkbookExtract.receive(context);
            }
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].data.status, 'Success');
            assert.strictEqual(context.sent[0].data.finishCode, 0);
        });
    });

    describe('JobFinished', function() {

        const page = jobs => ({ data: {
            pagination: { totalAvailable: String(jobs.length) },
            backgroundJobs: { backgroundJob: jobs }
        } });

        it('records the finished jobs on the first tick and emits only jobs that finish later', async function() {

            let jobs = [
                { id: 'j2', status: 'InProgress', createdAt: '2026-11-17T10:05:00Z', jobType: 'refresh_extracts' },
                { id: 'j1', status: 'Success', createdAt: '2026-11-17T10:00:00Z', jobType: 'refresh_extracts' }
            ];
            const handler = options => (options.url.endsWith('/auth/signin') ? signInResponse('token-1') : page(jobs));
            const context = createContext({ handler });
            await JobFinished.tick(context);
            assert.strictEqual(context.sent.length, 0);

            context.state = context.savedState;
            jobs = [{ ...jobs[0], status: 'Failed' }, jobs[1]];
            await JobFinished.tick(context);
            assert.deepStrictEqual(context.sent.map(s => s.data.id), ['j2']);

            context.state = context.savedState;
            await JobFinished.tick(context);
            assert.strictEqual(context.sent.length, 1);
        });

        it('keeps the state when Tableau answers with an empty page', async function() {

            let jobs = [{ id: 'j1', status: 'Success', createdAt: '2026-11-17T10:00:00Z' }];
            const handler = options => (options.url.endsWith('/auth/signin') ? signInResponse('token-1') : page(jobs));
            const context = createContext({ handler });
            await JobFinished.tick(context);
            context.state = context.savedState;
            context.savedState = null;
            jobs = [];
            await JobFinished.tick(context);
            assert.strictEqual(context.savedState, null);
        });
    });

    describe('NewWorkbook', function() {

        it('ignores events of another site and emits the workbook of a valid event', async function() {

            const handler = options => {
                if (options.url.endsWith('/auth/signin')) return signInResponse('token-1');
                return { data: { workbook: { id: 'wb-1', name: 'Sales' } } };
            };
            const event = (siteId) => ({ webhook: { content: { data: {
                resource: 'WORKBOOK', event_type: 'WorkbookCreated', resource_name: 'Sales',
                site_luid: siteId, resource_luid: 'wb-1', created_at: '2026-11-17T10:00:00Z'
            } } } });
            const context = createContext({ handler });
            let responses = 0;
            context.response = async () => { responses += 1; };

            context.messages = event('other-site');
            await NewWorkbook.receive(context);
            assert.strictEqual(context.sent.length, 0);

            context.messages = event('site-1');
            await NewWorkbook.receive(context);
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].data.eventType, 'WorkbookCreated');
            assert.strictEqual(context.sent[0].data.name, 'Sales');

            // Tableau may deliver an event twice.
            await NewWorkbook.receive(context);
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(responses, 3);
        });
    });
});
