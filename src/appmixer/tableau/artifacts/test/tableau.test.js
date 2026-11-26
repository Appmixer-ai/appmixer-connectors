'use strict';

const assert = require('assert');
const lib = require('../../lib');
const auth = require('../../auth');
const FindWorkbooks = require('../../core/FindWorkbooks/FindWorkbooks');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const RefreshWorkbookExtract = require('../../core/RefreshWorkbookExtract/RefreshWorkbookExtract');
const RefreshDataSourceExtract = require('../../core/RefreshDataSourceExtract/RefreshDataSourceExtract');
const RunExtractRefreshTask = require('../../core/RunExtractRefreshTask/RunExtractRefreshTask');
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

    describe('extract refresh options', function() {

        const finishedJob = (finishCode, notes) => ({ data: { job: {
            id: 'job-1', type: 'RefreshExtract', progress: '100', finishCode: String(finishCode),
            completedAt: '2026-11-17T10:03:00Z',
            statusNotes: notes ? { statusNote: [{ type: 'ErrorInfo', text: notes }] } : undefined
        } } });

        async function runRefresh(Component, content, finishCode, notes) {

            const handler = options => {
                if (options.url.endsWith('/auth/signin')) return signInResponse('token-1');
                if (options.method === 'POST') return { data: { job: { id: 'job-1', type: 'RefreshExtract' } } };
                return finishedJob(finishCode, notes);
            };
            const context = createContext({ handler, content });
            await Component.receive(context);
            context.messages = { timeout: { content: context.timeouts[0].data } };
            return context;
        }

        it('fails with the job ID and the notes when the job did not succeed (default)', async function() {

            const context = await runRefresh(RefreshDataSourceExtract, { datasourceId: 'ds-1' }, 1, 'Database login failed.');
            await assert.rejects(RefreshDataSourceExtract.receive(context), err => {
                assert(!(err instanceof context.CancelError), 'a failed job must be a retryable error');
                assert.match(err.message, /job-1/);
                assert.match(err.message, /Failed/);
                assert.match(err.message, /Database login failed\./);
                return true;
            });
            assert.strictEqual(context.sent.length, 0);
        });

        it('fails on a cancelled task run too', async function() {

            const context = await runRefresh(RunExtractRefreshTask, { taskId: 't-1', failOnUnsuccessfulJob: true }, 2);
            await assert.rejects(RunExtractRefreshTask.receive(context), /job-1 finished with status Cancelled/);
        });

        it('outputs the unsuccessful job when the option is off', async function() {

            const context = await runRefresh(RefreshWorkbookExtract, { workbookId: 'wb-1', failOnUnsuccessfulJob: false }, 1);
            await RefreshWorkbookExtract.receive(context);
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].data.status, 'Failed');
        });

        it('outputs a successful job with the option on', async function() {

            const context = await runRefresh(RefreshDataSourceExtract, { datasourceId: 'ds-1', failOnUnsuccessfulJob: true }, 0);
            await RefreshDataSourceExtract.receive(context);
            assert.strictEqual(context.sent[0].data.status, 'Success');
        });

        it('sends a full refresh with an empty body by default', async function() {

            const context = await runRefresh(RefreshDataSourceExtract, { datasourceId: 'ds-1' }, 0);
            const post = context.requests.find(r => r.method === 'POST' && r.url.endsWith('/refresh'));
            assert.strictEqual(post.url, 'https://10ay.online.tableau.com/api/3.19/sites/site-1/datasources/ds-1/refresh');
            assert.deepStrictEqual(post.data, {});
        });

        it('sends incremental="true" with API 3.28 for an incremental refresh', async function() {

            for (const [Component, content, url] of [
                [RefreshDataSourceExtract, { datasourceId: 'ds-1', incremental: true }, '/api/3.28/sites/site-1/datasources/ds-1/refresh'],
                [RefreshWorkbookExtract, { workbookId: 'wb-1', incremental: true }, '/api/3.28/sites/site-1/workbooks/wb-1/refresh']
            ]) {
                const context = await runRefresh(Component, content, 0);
                const post = context.requests.find(r => r.method === 'POST' && r.url.endsWith('/refresh'));
                assert.strictEqual(post.url, 'https://10ay.online.tableau.com' + url);
                assert.strictEqual(post.headers['Content-Type'], 'application/xml');
                assert.strictEqual(post.data, '<tsRequest><extractRefresh incremental="true" /></tsRequest>');
                assert.strictEqual(post.headers['X-Tableau-Auth'], 'token-1');
            }
        });
    });

    describe('Connected App authentication', function() {

        const CONNECTED_APP = {
            serverUrl: 'https://10ay.online.tableau.com',
            siteContentUrl: 'mysite',
            authMethod: 'connectedApp',
            clientId: 'client-1',
            secretId: 'secret-id-1',
            secretValue: 'secret-value-1',
            username: 'appmixer@example.com'
        };

        const decode = part => JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));

        it('signs in with an HS256 JWT of the connected app', async function() {

            const context = createContext({ handler: () => signInResponse('token-1') });
            const session = await lib.signIn(context, CONNECTED_APP);
            assert.strictEqual(session.token, 'token-1');
            const [request] = context.requests;
            assert.strictEqual(request.url, 'https://10ay.online.tableau.com/api/3.19/auth/signin');
            const { jwt, site } = request.data.credentials;
            assert.deepStrictEqual(site, { contentUrl: 'mysite' });
            assert.strictEqual(request.data.credentials.personalAccessTokenName, undefined);

            const [header, payload, signature] = jwt.split('.');
            assert.deepStrictEqual(decode(header), { alg: 'HS256', typ: 'JWT', kid: 'secret-id-1', iss: 'client-1' });
            const claims = decode(payload);
            assert.strictEqual(claims.iss, 'client-1');
            assert.strictEqual(claims.aud, 'tableau');
            assert.strictEqual(claims.sub, 'appmixer@example.com');
            assert(claims.jti);
            const ttl = claims.exp - Math.floor(Date.now() / 1000);
            assert(ttl > 0 && ttl <= 600, 'a connected app JWT is valid for 10 minutes at most');
            for (const scope of ['tableau:content:read', 'tableau:tasks:run', 'tableau:jobs:read', 'tableau:views:download']) {
                assert(claims.scp.includes(scope), scope);
            }
            const expected = require('crypto').createHmac('sha256', 'secret-value-1').update(header + '.' + payload)
                .digest('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
            assert.strictEqual(signature, expected);
        });

        it('uses a new jti on every sign-in', async function() {

            const first = decode(lib.connectedAppJwt(CONNECTED_APP).split('.')[1]);
            const second = decode(lib.connectedAppJwt(CONNECTED_APP).split('.')[1]);
            assert.notStrictEqual(first.jti, second.jti);
        });

        it('makes no request when a connected app field is missing', async function() {

            const context = createContext({ handler: () => assert.fail('no request expected') });
            await assert.rejects(auth.definition.validate({ ...context, ...CONNECTED_APP, secretValue: '' }), /Secret Value/);
            assert.strictEqual(context.requests.length, 0);
        });

        it('runs the components with the connected app session', async function() {

            const handler = options => {
                if (options.url.endsWith('/auth/signin')) {
                    assert(options.data.credentials.jwt);
                    return signInResponse('jwt-token');
                }
                assert.strictEqual(options.headers['X-Tableau-Auth'], 'jwt-token');
                return { data: { workbook: { id: 'wb-1' } } };
            };
            const context = createContext({ handler });
            context.auth = { ...CONNECTED_APP };
            const { data } = await lib.apiRequest(context, { path: '/workbooks/wb-1' });
            assert.strictEqual(data.workbook.id, 'wb-1');
        });

        it('keeps accounts without an authentication method on the Personal Access Token', function() {

            assert.strictEqual(lib.authMethod(AUTH), 'pat');
            assert.strictEqual(lib.authMethod({ ...CONNECTED_APP, authMethod: undefined }), 'connectedApp');
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
