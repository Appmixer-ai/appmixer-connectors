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

const readAll = async (stream) => {

    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString();
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

        it('connects with an OAuth client (M2M) and caches the access token', async function() {

            const context = createContext({ auth: undefined, tenant: TENANT, clientId: 'c1', clientSecret: 'secret-validate' });
            context.httpRequest.withArgs(sinon.match({ url: ORIGIN + '/oauth/token' }))
                .resolves({ data: { access_token: 'tok-1', token_type: 'bearer', expires_in: 21600 } });
            context.httpRequest.withArgs(sinon.match({ url: ORIGIN + '/api/v1/users/me' }))
                .resolves({ data: { id: 'bot', name: 'Bot' } });
            assert.strictEqual(await auth.definition.validate(context), true);
            await auth.definition.requestProfileInfo(context);
            const calls = context.httpRequest.getCalls().map(call => call.args[0]);
            const tokenCalls = calls.filter(options => options.url === ORIGIN + '/oauth/token');
            assert.strictEqual(tokenCalls.length, 1, 'the token is requested once and cached');
            assert.deepStrictEqual(tokenCalls[0].data, { client_id: 'c1', client_secret: 'secret-validate', grant_type: 'client_credentials' });
            const apiCalls = calls.filter(options => options.url === ORIGIN + '/api/v1/users/me');
            assert.strictEqual(apiCalls.length, 2);
            apiCalls.forEach(options => assert.strictEqual(options.headers.Authorization, 'Bearer tok-1'));
        });

        it('refuses an account with both an API key and an OAuth client, or a half OAuth client', async function() {

            for (const fields of [
                { apiKey: 'key-1', clientId: 'c1', clientSecret: 's1' },
                { clientId: 'c1' },
                {}
            ]) {
                const context = createContext({ auth: undefined, tenant: TENANT, ...fields });
                await assert.rejects(auth.definition.validate(context), Error, JSON.stringify(fields));
                assert.strictEqual(context.httpRequest.callCount, 0);
            }
        });

        it('components renew a rejected OAuth token once', async function() {

            const context = createContext({ auth: { tenant: TENANT, clientId: 'c2', clientSecret: 'secret-renew' } });
            let token = 0;
            context.httpRequest.withArgs(sinon.match({ url: ORIGIN + '/oauth/token' }))
                .callsFake(async () => ({ data: { access_token: 'tok-' + (++token), expires_in: 21600 } }));
            context.httpRequest.withArgs(sinon.match({ url: ORIGIN + '/api/v1/spaces', headers: { Authorization: 'Bearer tok-1' } }))
                .rejects(httpError(401, { errors: [{ code: 'AUTH-1', title: 'Unauthorized' }] }));
            context.httpRequest.withArgs(sinon.match({ url: ORIGIN + '/api/v1/spaces', headers: { Authorization: 'Bearer tok-2' } }))
                .resolves({ data: { data: [] } });
            const { data } = await lib.apiRequest(context, { path: '/api/v1/spaces' });
            assert.deepStrictEqual(data, { data: [] });
            assert.strictEqual(token, 2);
        });

        it('reports a rejected OAuth client as a CancelError', async function() {

            const context = createContext({ auth: { tenant: TENANT, clientId: 'c3', clientSecret: 'secret-bad' } });
            context.httpRequest.rejects(httpError(401, { error: 'invalid_client', error_description: 'client authentication failed' }));
            await assert.rejects(lib.apiRequest(context, { path: '/api/v1/spaces' }), (err) => {
                return err instanceof CancelError
                    && /OAuth token request failed \(401\): client authentication failed/.test(err.message);
            });
            assert.strictEqual(context.httpRequest.callCount, 1, 'no API request without a token');
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
            const off = { ...content, failIfNotSucceeded: false };
            const context = createContext({ messages: { timeout: { content: off } } });
            context.httpRequest.resolves({ data: { id: 'r1', appId: 'a1', status: 'FAILED', errorCode: 'X' } });
            await component.receive(context);
            assert.strictEqual(context.sent[0].data.status, 'FAILED');
            assert.strictEqual(context.sent[0].data.succeeded, false);

            const ok = createContext({ messages: { timeout: { content: { ...content, failIfNotSucceeded: true } } } });
            ok.httpRequest.resolves({ data: { id: 'r1', appId: 'a1', status: 'SUCCEEDED' } });
            await component.receive(ok);
            assert.strictEqual(ok.sent[0].data.succeeded, true);
        });

        it('fails on a reload that does not succeed (default on), with the reload ID, error code and log', async function() {

            const component = load('ReloadApp');
            const log = 'x'.repeat(2000) + '\nThe following error occurred: Field not found <Region>';
            for (const status of ['FAILED', 'CANCELED', 'EXCEEDED_LIMIT']) {
                // A job scheduled before the option existed carries no flag: the default applies.
                const content = { reloadId: 'r9', appId: 'a1', deadline: Date.now() + 60000, timeoutMinutes: 5 };
                const context = createContext({ messages: { timeout: { content } } });
                context.httpRequest.resolves({ data: { id: 'r9', appId: 'a1', status, errorCode: 'EngineReloadScriptError', errorMessage: 'Script error', log } });
                await assert.rejects(component.receive(context), (err) => {
                    return err instanceof CancelError
                        && err.message.includes('r9') && err.message.includes(status)
                        && err.message.includes('EngineReloadScriptError') && err.message.includes('Field not found <Region>')
                        && err.message.length < 1500;
                }, status);
                assert.strictEqual(context.sent.length, 0);
            }
        });

        it('passes the option to the poll and fails on an immediate final status', async function() {

            const component = load('ReloadApp');
            const queued = createContext({ messages: { in: { content: { appId: 'a1' } } } });
            queued.httpRequest.resolves({ data: { id: 'r1', appId: 'a1', status: 'QUEUED' } });
            await component.receive(queued);
            assert.strictEqual(queued.setTimeout.firstCall.args[0].failIfNotSucceeded, true);

            const off = createContext({ messages: { in: { content: { appId: 'a1', failIfNotSucceeded: false } } } });
            off.httpRequest.resolves({ data: { id: 'r1', appId: 'a1', status: 'QUEUED' } });
            await component.receive(off);
            assert.strictEqual(off.setTimeout.firstCall.args[0].failIfNotSucceeded, false);

            const failed = createContext({ messages: { in: { content: { appId: 'a1' } } } });
            failed.httpRequest.resolves({ data: { id: 'r2', appId: 'a1', status: 'FAILED', errorCode: 'E1' } });
            await assert.rejects(component.receive(failed), /r2[\s\S]*FAILED[\s\S]*E1/);
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
                getFileInfo: async () => ({ filename: 'x.csv', length: 8 }),
                getFileReadStream: async () => Readable.from([Buffer.from('a,b\n1,2\n')])
            });
            context.httpRequest.onCall(0).resolves({ data: { data: [{ id: 'd1', name: 'sales.csv', size: 8 }] } });
            context.httpRequest.onCall(1).resolves({ data: { maxFileSize: 500 * 1024 * 1024 } });
            context.httpRequest.onCall(2).resolves({ data: { id: 'd1', name: 'sales.csv', size: 8 } });
            await component.receive(context);
            assert.strictEqual(context.httpRequest.secondCall.args[0].url, ORIGIN + '/api/v1/data-files/quotas');
            const upload = context.httpRequest.thirdCall.args[0];
            assert.strictEqual(upload.method, 'PUT');
            assert.strictEqual(upload.url, ORIGIN + '/api/v1/data-files/d1');
            assert.match(upload.headers['Content-Type'], /^multipart\/form-data; boundary=/);
            assert.strictEqual(upload.maxBodyLength, Infinity);
            assert.strictEqual(typeof upload.data.pipe, 'function', 'the body is a stream, not a buffer');
            const sentBody = await readAll(upload.data);
            assert.strictEqual(upload.headers['Content-Length'], Buffer.byteLength(sentBody));
            assert.match(sentBody, /name="Json"[\s\S]*"name":"sales.csv"/);
            assert.match(sentBody, /name="File"; filename="sales.csv"[\s\S]*a,b\n1,2\n\r\n--/);
        });

        it('fails before uploading a file over the user\'s limits', async function() {

            const component = load('UploadDataFile');
            const MB = 1024 * 1024;
            for (const quotas of [
                { maxFileSize: 500 * MB, maxLargeFileSize: 50 * MB },
                { maxSize: 100 * MB, size: 90 * MB }
            ]) {
                const context = createContext({
                    messages: { in: { content: { fileId: 'f1', fileName: 'big.csv', replace: false } } },
                    getFileInfo: async () => ({ filename: 'big.csv', length: 60 * MB }),
                    getFileReadStream: sinon.stub()
                });
                context.httpRequest.onCall(0).resolves({ data: quotas });
                await assert.rejects(component.receive(context), (err) => {
                    return err instanceof CancelError && /60 MB/.test(err.message);
                });
                assert.strictEqual(context.httpRequest.callCount, 1, 'only the quotas were read');
                assert.strictEqual(context.getFileReadStream.callCount, 0);
            }
        });

        it('uploads a file over the direct limit through temp-contents', async function() {

            const component = load('UploadDataFile');
            const context = createContext({
                messages: { in: { content: { fileId: 'f1', fileName: 'folder/big.csv', replace: false } } },
                getFileInfo: async () => ({ filename: 'big.csv', length: 20 }),
                getFileReadStream: async () => Readable.from([Buffer.from('0123456789'), Buffer.from('0123456789')])
            });
            context.httpRequest.onCall(0).resolves({ data: { maxFileSize: 10, maxLargeFileSize: 1000 } });
            context.httpRequest.onCall(1).resolves({ status: 201, headers: { location: '/api/v1/temp-contents/tmp-7' }, data: {} });
            context.httpRequest.onCall(2).resolves({ data: { id: 'd2', name: 'folder/big.csv', size: 20 } });
            await component.receive(context);
            const temp = context.httpRequest.secondCall.args[0];
            assert.strictEqual(temp.url, ORIGIN + '/api/v1/temp-contents');
            assert.strictEqual(temp.params.filename, 'big.csv');
            assert.strictEqual(temp.headers['Content-Length'], 20);
            assert.strictEqual(await readAll(temp.data), '01234567890123456789');
            const upload = context.httpRequest.thirdCall.args[0];
            assert.strictEqual(upload.method, 'POST');
            const sentBody = await readAll(upload.data);
            assert.match(sentBody, /"tempContentFileId":"tmp-7"/);
            assert.doesNotMatch(sentBody, /name="File"/);
            assert.strictEqual(context.sent[0].data.id, 'd2');
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

        it('emits nothing and does not fail when the finished reload was deleted before delivery', async function() {

            const component = load('ReloadFinished');
            const state = { webhookId: 'w1', token: 'a'.repeat(48), eventType: 'com.qlik.v1.reload.finished' };
            const event = { type: 'com.qlik.v1.reload.finished', data: { id: 'r2', appId: 'a1', status: 'CANCELED' } };
            const context = createContext({
                state,
                messages: { webhook: { content: { query: { token: state.token }, data: event } } }
            });
            context.httpRequest.rejects(Object.assign(new Error('Not found'), {
                response: { status: 404, data: { errors: [{ code: 'RELOADS-004', title: 'Resource not found.' }] } }
            }));
            await component.receive(context);
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.response.callCount, 1);
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
