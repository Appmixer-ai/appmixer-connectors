'use strict';

const assert = require('assert');
const path = require('path');
const { Readable } = require('stream');
const sinon = require('sinon');

const ROOT = path.join(__dirname, '../..');
const lib = require(path.join(ROOT, 'lib.js'));
const auth = require(path.join(ROOT, 'auth.js'));
const load = (name) => require(path.join(ROOT, 'core', name, name + '.js'));

class CancelError extends Error {}

const TENANT = 'acme.eu.qlikcloud.com';
const ORIGIN = 'https://acme.eu.qlikcloud.com';

const createContext = (overrides = {}) => {

    let state = overrides.state;
    const sent = [];
    const context = {
        auth: { tenant: TENANT, apiKey: 'key-1' },
        config: {},
        properties: {},
        messages: { in: { content: {} } },
        flowId: 'flow-1',
        componentId: 'component-1',
        CancelError,
        httpRequest: sinon.stub(),
        sendJson: sinon.stub().callsFake(async (data, port) => sent.push({ data, port })),
        setTimeout: sinon.stub().resolves(),
        response: sinon.stub().resolves(),
        getWebhookUrl: () => 'https://api.appmixer.example/flows/flow-1/components/component-1',
        loadState: async () => state,
        saveState: async (value) => {
            state = value;
        },
        log: async () => {},
        ...overrides
    };
    context.sent = sent;
    context.getState = () => state;
    return context;
};

const httpError = (status, data) => Object.assign(new Error('Request failed with status code ' + status), {
    response: { status, data }
});

describe('appmixer.qliksense', function() {

    describe('lib.tenantOrigin', function() {

        it('accepts a tenant hostname or https URL', function() {

            assert.strictEqual(lib.tenantOrigin('acme.eu.qlikcloud.com'), ORIGIN);
            assert.strictEqual(lib.tenantOrigin(' https://Acme.eu.qlikcloud.com/ '), ORIGIN);
            assert.strictEqual(lib.tenantOrigin('gov1.us.qlikcloudgov.com'), 'https://gov1.us.qlikcloudgov.com');
        });

        it('rejects hosts outside qlikcloud.com', function() {

            for (const value of [
                'evil.com', 'acme.eu.qlikcloud.com.evil.com', 'evil.com/x.qlikcloud.com', 'evil.com#.qlikcloud.com',
                'http://acme.eu.qlikcloud.com', 'https://user:pw@acme.eu.qlikcloud.com', 'https://acme.eu.qlikcloud.com:8443',
                'https://acme.eu.qlikcloud.com/api', '', undefined
            ]) {
                assert.throws(() => lib.tenantOrigin(value), /Invalid Qlik Cloud tenant/, String(value));
            }
        });
    });

    describe('lib.apiRequest', function() {

        it('sends the API key and API version to the tenant', async function() {

            const context = createContext();
            context.httpRequest.resolves({ data: { ok: true } });
            await lib.apiRequest(context, { path: '/api/v1/spaces', params: { limit: 1 } });
            const options = context.httpRequest.firstCall.args[0];
            assert.strictEqual(options.url, ORIGIN + '/api/v1/spaces');
            assert.strictEqual(options.headers.Authorization, 'Bearer key-1');
            assert.strictEqual(options.headers['qlik-api-version'], lib.API_VERSION);
        });

        it('never sends the key when the tenant is not a Qlik Cloud host', async function() {

            const context = createContext({ auth: { tenant: 'attacker.example.com', apiKey: 'key-1' } });
            await assert.rejects(lib.apiRequest(context, { path: '/api/v1/spaces' }), CancelError);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });

        it('turns client errors into CancelError with the Qlik message, keeps 429 retryable', async function() {

            const context = createContext();
            context.httpRequest.rejects(httpError(404, { errors: [{ code: 'APP-1', title: 'Not found' }] }));
            await assert.rejects(lib.apiRequest(context, { path: '/api/v1/apps/x' }), (err) => {
                return err instanceof CancelError && err.status === 404 && /APP-1: Not found/.test(err.message);
            });
            context.httpRequest.rejects(httpError(429, {}));
            await assert.rejects(lib.apiRequest(context, { path: '/api/v1/apps/x' }), (err) => {
                return !(err instanceof CancelError) && err.status === 429;
            });
        });
    });

    describe('auth.js', function() {

        it('validates with /users/me and names the account', async function() {

            const context = createContext({ auth: undefined, tenant: TENANT, apiKey: 'key-1' });
            context.httpRequest.resolves({ data: { id: 'u1', name: 'Jane', email: 'jane@example.com', tenantId: 't1' } });
            assert.strictEqual(await auth.definition.validate(context), true);
            const profile = await auth.definition.requestProfileInfo(context);
            assert.strictEqual(context.httpRequest.firstCall.args[0].url, ORIGIN + '/api/v1/users/me');
            assert.strictEqual(auth.definition.accountNameFromProfileInfo({ profileInfo: profile }), 'jane@example.com (acme.eu.qlikcloud.com)');
        });
    });

    describe('MakeApiCall', function() {

        it('pins requests to the tenant', async function() {

            const component = load('MakeApiCall');
            const context = createContext({ messages: { in: { content: { url: 'https://evil.example/api', method: 'GET' } } } });
            await assert.rejects(component.receive(context), CancelError);
            assert.strictEqual(context.httpRequest.callCount, 0);

            const ok = createContext({ messages: { in: { content: { url: '/api/v1/spaces', method: 'POST', body: '{"name":"x"}' } } } });
            ok.httpRequest.resolves({ status: 201, headers: {}, data: { id: 's1' } });
            await component.receive(ok);
            assert.strictEqual(ok.httpRequest.firstCall.args[0].url, ORIGIN + '/api/v1/spaces');
            assert.deepStrictEqual(ok.httpRequest.firstCall.args[0].data, { name: 'x' });
            assert.deepStrictEqual(ok.sent[0], { data: { statusCode: 201, headers: {}, body: { id: 's1' } }, port: 'out' });
        });
    });

    describe('ReloadApp', function() {

        it('starts the reload and schedules a poll', async function() {

            const component = load('ReloadApp');
            const context = createContext({ messages: { in: { content: { appId: 'a1', variables: '{"region":"EU"}', timeoutMinutes: 5 } } } });
            context.httpRequest.resolves({ data: { id: 'r1', appId: 'a1', status: 'QUEUED' } });
            await component.receive(context);
            assert.deepStrictEqual(context.httpRequest.firstCall.args[0].data, { appId: 'a1', variables: { region: 'EU' } });
            const [job, delay] = context.setTimeout.firstCall.args;
            assert.strictEqual(job.reloadId, 'r1');
            assert.strictEqual(delay, lib.POLL_INTERVAL_MS);
            assert.strictEqual(context.sent.length, 0);
        });

        it('emits the reload when it reaches a final status', async function() {

            const component = load('ReloadApp');
            const content = { reloadId: 'r1', appId: 'a1', deadline: Date.now() + 60000, timeoutMinutes: 5 };
            const context = createContext({ messages: { timeout: { content } } });
            context.httpRequest.resolves({ data: { id: 'r1', appId: 'a1', status: 'FAILED', errorCode: 'X' } });
            await component.receive(context);
            assert.strictEqual(context.sent[0].data.status, 'FAILED');
            assert.strictEqual(context.sent[0].data.succeeded, false);
        });

        it('polls again while running and fails after the deadline', async function() {

            const component = load('ReloadApp');
            const running = createContext({ messages: { timeout: { content: { reloadId: 'r1', appId: 'a1', deadline: Date.now() + 60000 } } } });
            running.httpRequest.resolves({ data: { id: 'r1', status: 'RELOADING' } });
            await component.receive(running);
            assert.strictEqual(running.setTimeout.callCount, 1);

            const late = createContext({ messages: { timeout: { content: { reloadId: 'r1', appId: 'a1', deadline: Date.now() - 1, timeoutMinutes: 5 } } } });
            late.httpRequest.resolves({ data: { id: 'r1', status: 'RELOADING' } });
            await assert.rejects(component.receive(late), CancelError);
        });
    });

    describe('GenerateReport', function() {

        it('builds sheet and visualization requests', function() {

            const { buildRequest } = load('GenerateReport');
            const sheet = buildRequest({ appId: 'a1', objectType: 'sheet', objectId: 's1', format: 'pdf', timeoutMinutes: 30 });
            assert.strictEqual(sheet.type, 'sense-sheet-1.0');
            assert.deepStrictEqual(sheet.senseSheetTemplate, { appId: 'a1', sheet: { id: 's1' } });
            assert.strictEqual(sheet.output.type, 'pdf');
            const image = buildRequest({ appId: 'a1', objectType: 'visualization', objectId: 'v1', format: 'png', timeoutMinutes: 30 });
            assert.strictEqual(image.type, 'sense-image-1.0');
            assert.deepStrictEqual(image.output.imageOutput, { outFormat: 'png' });
            assert.strictEqual(image.senseImageTemplate.visualization.widthPx, 1280);
        });

        it('downloads the output only from the tenant', async function() {

            const component = load('GenerateReport');
            const job = { reportId: 'rep1', appId: 'a1', objectId: 's1', format: 'pdf', fileName: 'out', deadline: Date.now() + 60000 };
            const context = createContext({
                messages: { timeout: { content: job } },
                saveFileStream: sinon.stub().resolves({ fileId: 'f1' })
            });
            context.httpRequest.onCall(0).resolves({ data: { status: 'done' } });
            context.httpRequest.onCall(1).resolves({ data: { data: [{ outputId: 'appmixer', status: 'done', location: 'https://evil.example/file' }] } });
            await assert.rejects(component.receive(context), CancelError);
            assert.strictEqual(context.httpRequest.callCount, 2);

            const good = createContext({
                messages: { timeout: { content: job } },
                saveFileStream: sinon.stub().resolves({ fileId: 'f1' })
            });
            good.httpRequest.onCall(0).resolves({ data: { status: 'done' } });
            const location = ORIGIN + '/api/v1/temp-contents/t1';
            good.httpRequest.onCall(1).resolves({ data: { data: [{ outputId: 'appmixer', status: 'done', location }] } });
            good.httpRequest.onCall(2).resolves({ data: Buffer.from('%PDF') });
            await component.receive(good);
            assert.strictEqual(good.sent[0].data.fileId, 'f1');
            assert.strictEqual(good.sent[0].data.fileName, 'out.pdf');
        });
    });

    describe('UploadDataFile', function() {

        it('replaces a file of the same name', async function() {

            const component = load('UploadDataFile');
            const context = createContext({
                messages: { in: { content: { fileId: 'f1', fileName: 'sales.csv' } } },
                getFileInfo: async () => ({ filename: 'x.csv' }),
                getFileReadStream: async () => Readable.from([Buffer.from('a,b\n1,2\n')])
            });
            context.httpRequest.onCall(0).resolves({ data: { data: [{ id: 'd1', name: 'sales.csv' }] } });
            context.httpRequest.onCall(1).resolves({ data: { id: 'd1', name: 'sales.csv', size: 8 } });
            await component.receive(context);
            const upload = context.httpRequest.secondCall.args[0];
            assert.strictEqual(upload.method, 'PUT');
            assert.strictEqual(upload.url, ORIGIN + '/api/v1/data-files/d1');
            assert.match(upload.headers['Content-Type'], /^multipart\/form-data; boundary=/);
            const sentBody = upload.data.toString();
            assert.match(sentBody, /name="Json"[\s\S]*"name":"sales.csv"/);
            assert.match(sentBody, /name="File"; filename="sales.csv"[\s\S]*a,b/);
        });
    });

    describe('InviteUser', function() {

        it('fails on an invitee error', async function() {

            const component = load('InviteUser');
            const context = createContext({ messages: { in: { content: { email: 'x@example.com' } } } });
            context.httpRequest.resolves({ status: 207, data: { data: [{ status: 'error', code: 'USERS-1', title: 'Bad email' }] } });
            await assert.rejects(component.receive(context), /USERS-1: Bad email/);
        });
    });

    describe('webhook triggers', function() {

        it('registers a user-level webhook with a token and deletes it on stop', async function() {

            const component = load('ReloadFinished');
            const context = createContext();
            context.httpRequest.onCall(0).resolves({ data: { data: [{ name: 'com.qlik.v1.reload.finished', levels: ['tenant', 'user'] }] } });
            context.httpRequest.onCall(1).resolves({ data: { id: 'w1' } });
            await component.start(context);
            const body = context.httpRequest.secondCall.args[0].data;
            assert.deepStrictEqual(body.eventTypes, ['com.qlik.v1.reload.finished']);
            assert.strictEqual(body.level, 'user');
            const state = context.getState();
            assert.strictEqual(state.webhookId, 'w1');
            assert.ok(body.url.endsWith('?token=' + state.token));

            context.httpRequest.resetHistory();
            context.httpRequest.resolves({});
            await component.stop(context);
            assert.strictEqual(context.httpRequest.firstCall.args[0].method, 'DELETE');
            assert.strictEqual(context.httpRequest.firstCall.args[0].url, ORIGIN + '/api/core/webhooks/w1');
        });

        it('ignores deliveries without the token and emits the reload read back from the API', async function() {

            const component = load('ReloadFinished');
            const state = { webhookId: 'w1', token: 'a'.repeat(48), eventType: 'com.qlik.v1.reload.finished' };
            const event = { type: 'com.qlik.v1.reload.finished', data: { id: 'r1', appId: 'a1', status: 'SUCCEEDED' } };

            const forged = createContext({ state, messages: { webhook: { content: { query: { token: 'b'.repeat(48) }, data: event } } } });
            await component.receive(forged);
            assert.strictEqual(forged.sent.length, 0);
            assert.strictEqual(forged.httpRequest.callCount, 0);
            assert.strictEqual(forged.response.callCount, 1);

            const real = createContext({
                state,
                messages: { webhook: { content: { query: { token: state.token }, data: event } } }
            });
            real.httpRequest.resolves({ data: { id: 'r1', appId: 'a1', status: 'SUCCEEDED', type: 'hub' } });
            await component.receive(real);
            assert.strictEqual(real.sent[0].data.id, 'r1');
            assert.strictEqual(real.sent[0].data.succeeded, true);
        });

        it('filters app events by space', async function() {

            const component = load('AppDeleted');
            const state = { webhookId: 'w1', token: 't'.repeat(48), eventType: 'com.qlik.v1.app.deleted' };
            const event = { type: 'com.qlik.v1.app.deleted', time: '2026-11-16T12:00:00Z', data: { id: 'a1', name: 'A', spaceId: 's2' } };
            const other = createContext({ state, properties: { spaceId: 's1' }, messages: { webhook: { content: { query: { token: state.token }, data: event } } } });
            await component.receive(other);
            assert.strictEqual(other.sent.length, 0);
            const match = createContext({ state, properties: { spaceId: 's2' }, messages: { webhook: { content: { query: { token: state.token }, data: event } } } });
            await component.receive(match);
            assert.strictEqual(match.sent[0].data.id, 'a1');
            assert.strictEqual(match.sent[0].data.deletedAt, '2026-11-16T12:00:00Z');
        });

        // The shape Qlik Cloud delivers: the app is under data.attributes, with no toplevelresourceid.
        const appEvent = (type) => ({
            specversion: '1.0.2',
            type,
            time: '2026-11-25T12:03:13Z',
            userid: 'u1',
            data: { attributes: { _resourcetype: 'app', id: 'a1', name: 'E2E app', spaceId: '', usage: 'ANALYTICS', deleteType: 'HARD' } }
        });

        it('reads the app from data.attributes of a delivered app.created event', async function() {

            const component = load('NewApp');
            const state = { webhookId: 'w1', token: 't'.repeat(48), eventType: 'com.qlik.v1.app.created' };
            const context = createContext({
                state,
                messages: { webhook: { content: { query: { token: state.token }, data: appEvent('com.qlik.v1.app.created') } } }
            });
            context.httpRequest.resolves({ data: { attributes: { id: 'a1', name: 'E2E app', spaceId: '' } } });
            await component.receive(context);
            assert.strictEqual(context.httpRequest.firstCall.args[0].url, ORIGIN + '/api/v1/apps/a1');
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].data.id, 'a1');
            assert.strictEqual(context.response.callCount, 1);
        });

        it('reads the app from data.attributes of a delivered app.deleted event', async function() {

            const component = load('AppDeleted');
            const state = { webhookId: 'w1', token: 't'.repeat(48), eventType: 'com.qlik.v1.app.deleted' };
            const context = createContext({
                state,
                messages: { webhook: { content: { query: { token: state.token }, data: appEvent('com.qlik.v1.app.deleted') } } }
            });
            await component.receive(context);
            assert.strictEqual(context.sent.length, 1);
            assert.deepStrictEqual(context.sent[0].data, {
                id: 'a1', name: 'E2E app', spaceId: '', usage: 'ANALYTICS', deleteType: 'HARD',
                deletedAt: '2026-11-25T12:03:13Z', deletedBy: 'u1'
            });
        });
    });
});
