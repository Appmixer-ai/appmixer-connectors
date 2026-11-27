'use strict';

const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const sinon = require('sinon');

const ROOT = path.join(__dirname, '../..');
const lib = require(path.join(ROOT, 'lib.js'));
const load = (name) => require(path.join(ROOT, 'core', name, name + '.js'));

class CancelError extends Error {}

const createContext = (overrides = {}) => {

    let state = overrides.state;
    const sent = [];
    const context = {
        auth: { apiKey: 'pd_test_key' },
        config: {},
        properties: {},
        componentId: 'component-1',
        messages: { in: { content: {} } },
        CancelError,
        httpRequest: sinon.stub(),
        sendJson: sinon.stub().callsFake(async (data, port) => sent.push({ data, port })),
        setTimeout: sinon.stub().resolves(),
        response: sinon.stub().resolves(),
        getWebhookUrl: () => 'https://api.appmixer.example/flows/1/components/2',
        loadState: async () => state,
        saveState: async (value) => {
            state = value;
        },
        lock: async () => ({ unlock: async () => {} }),
        staticCache: (() => {
            const cache = new Map();
            return { get: async (key) => cache.get(key), set: async (key, value) => cache.set(key, value) };
        })(),
        log: async () => {},
        ...overrides
    };
    context.sent = sent;
    context.getState = () => state;
    return context;
};

const httpError = (status, data, headers = {}) => {

    const err = new Error('Request failed with status code ' + status);
    err.response = { status, data, headers };
    return err;
};

describe('appmixer.pandadoc', function() {

    afterEach(() => sinon.restore());

    describe('lib.request', function() {

        it('sends the key as "API-Key <key>" to api.pandadoc.com', async function() {

            const context = createContext();
            context.httpRequest.resolves({ data: { id: 'doc1' } });

            await lib.request(context, { path: '/public/v1/documents/doc1' });

            const options = context.httpRequest.firstCall.args[0];
            assert.strictEqual(options.url, 'https://api.pandadoc.com/public/v1/documents/doc1');
            assert.strictEqual(options.headers.Authorization, 'API-Key pd_test_key');
        });

        it('turns a client error into a CancelError with PandaDoc\'s detail', async function() {

            const context = createContext();
            context.httpRequest.rejects(httpError(400, { type: 'request_error', detail: 'Template not found' }));

            await assert.rejects(
                lib.request(context, { path: '/public/v1/documents', method: 'POST', data: {} }),
                (e) => e instanceof CancelError && /Template not found/.test(e.message)
            );
        });

        it('waits out a 429 and retries', async function() {

            const clock = sinon.useFakeTimers();
            const context = createContext();
            context.httpRequest.onFirstCall().rejects(httpError(429, {}, { 'retry-after': '2' }));
            context.httpRequest.onSecondCall().resolves({ data: { ok: true } });

            const promise = lib.request(context, { path: '/public/v1/templates' });
            await clock.tickAsync(2000);
            const body = await promise;

            assert.deepStrictEqual(body, { ok: true });
            assert.strictEqual(context.httpRequest.callCount, 2);
            clock.restore();
        });
    });

    describe('MakeApiCall', function() {

        it('refuses a URL on another host and makes no request', async function() {

            const context = createContext({
                messages: { in: { content: { url: 'https://evil.example/public/v1/documents', method: 'GET' } } }
            });

            await assert.rejects(load('MakeApiCall').receive(context), CancelError);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });

        it('refuses a protocol-relative URL', function() {

            assert.throws(() => lib.resolveApiUrl(createContext(), '//evil.example/x'), CancelError);
        });

        it('passes key-value headers and parameters as the Designer stores them', async function() {

            const context = createContext({
                messages: {
                    in: {
                        content: {
                            url: '/public/v1/documents',
                            method: 'GET',
                            headers: '{"Accept":"application/json"}',
                            parameters: '{"count":"5"}'
                        }
                    }
                }
            });
            context.httpRequest.resolves({ status: 200, headers: {}, data: { results: [] } });

            await load('MakeApiCall').receive(context);

            const options = context.httpRequest.firstCall.args[0];
            assert.strictEqual(options.url, 'https://api.pandadoc.com/public/v1/documents');
            assert.strictEqual(options.headers.Accept, 'application/json');
            assert.strictEqual(options.headers.Authorization, 'API-Key pd_test_key');
            assert.deepStrictEqual(options.params, { count: '5' });
        });
    });

    describe('Create Document From Template', function() {

        const input = {
            templateId: 'tpl1',
            name: 'Quote',
            recipientEmail: 'john@example.com',
            recipientFirstName: 'John',
            recipientRole: 'Client',
            tokens: '{"Client.Company":"Acme"}',
            fields: '{"Amount":"100"}',
            metadata: '{"deal":"42"}',
            tags: 'a, b',
            waitForDraft: true
        };

        it('builds the request body and schedules the wait for the draft status', async function() {

            const context = createContext({ messages: { in: { content: input } } });
            context.httpRequest.resolves({ data: { id: 'doc1', name: 'Quote', status: 'document.uploaded' } });

            await load('CreateDocumentFromTemplate').receive(context);

            const { data } = context.httpRequest.firstCall.args[0];
            assert.deepStrictEqual(data, {
                template_uuid: 'tpl1',
                name: 'Quote',
                recipients: [{ email: 'john@example.com', first_name: 'John', role: 'Client' }],
                tokens: [{ name: 'Client.Company', value: 'Acme' }],
                fields: { Amount: { value: '100' } },
                metadata: { deal: '42' },
                tags: ['a', 'b']
            });
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.setTimeout.firstCall.args[0].documentId, 'doc1');
            assert.ok(context.setTimeout.firstCall.args[1] >= 60000);
        });

        it('emits the document right away when Wait Until Ready is off', async function() {

            const context = createContext({ messages: { in: { content: { ...input, waitForDraft: false } } } });
            context.httpRequest.resolves({ data: { id: 'doc1', name: 'Quote', status: 'document.uploaded' } });

            await load('CreateDocumentFromTemplate').receive(context);

            assert.strictEqual(context.sent[0].data.status, 'document.uploaded');
            assert.strictEqual(context.setTimeout.callCount, 0);
        });

        it('requires a recipient', async function() {

            const context = createContext({ messages: { in: { content: { templateId: 'tpl1' } } } });
            await assert.rejects(load('CreateDocumentFromTemplate').receive(context), CancelError);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });

        it('emits the document from the continuation once it is a draft', async function() {

            const context = createContext({
                messages: { timeout: { content: { documentId: 'doc1', deadline: Date.now() + 60000 } } }
            });
            context.httpRequest.resolves({ data: { id: 'doc1', name: 'Quote', status: 'document.draft', links: [] } });

            await load('CreateDocumentFromTemplate').receive(context);

            assert.strictEqual(context.sent[0].data.status, 'document.draft');
            assert.strictEqual(context.sent[0].data.links, undefined);
        });

        it('keeps waiting while the document is uploaded and fails after the deadline', async function() {

            const waiting = createContext({
                messages: { timeout: { content: { documentId: 'doc1', deadline: Date.now() + 60000 } } }
            });
            waiting.httpRequest.resolves({ data: { id: 'doc1', status: 'document.uploaded' } });
            await load('CreateDocumentFromTemplate').receive(waiting);
            assert.strictEqual(waiting.setTimeout.callCount, 1);

            const late = createContext({
                messages: { timeout: { content: { documentId: 'doc1', deadline: Date.now() - 1 } } }
            });
            late.httpRequest.resolves({ data: { id: 'doc1', status: 'document.uploaded' } });
            await assert.rejects(load('CreateDocumentFromTemplate').receive(late), CancelError);
        });
    });

    describe('Find Documents', function() {

        it('maps the status name to PandaDoc\'s numeric status filter', async function() {

            const context = createContext({
                messages: { in: { content: { status: 'document.completed', tag: 'x', outputType: 'array' } } }
            });
            context.httpRequest.resolves({ data: { results: [{ id: 'doc1' }] } });

            await load('FindDocuments').receive(context);

            const { params } = context.httpRequest.firstCall.args[0];
            assert.strictEqual(params.status, 2);
            assert.strictEqual(params.tag, 'x');
            assert.strictEqual(params.count, 100);
            assert.deepStrictEqual(context.sent[0], { data: { result: [{ id: 'doc1' }], count: 1 }, port: 'out' });
        });

        it('sends to notFound when nothing matches', async function() {

            const context = createContext({ messages: { in: { content: { outputType: 'array' } } } });
            context.httpRequest.resolves({ data: { results: [] } });

            await load('FindDocuments').receive(context);

            assert.strictEqual(context.sent[0].port, 'notFound');
        });
    });

    describe('webhook triggers', function() {

        it('registers a subscription with a secret token in the URL and stores the shared key', async function() {

            const context = createContext();
            context.httpRequest.resolves({ data: { uuid: 'sub-1', shared_key: 'shared' } });

            await load('DocumentStateChanged').start(context);

            const { data } = context.httpRequest.firstCall.args[0];
            const url = new URL(data.url);
            assert.deepStrictEqual(data.triggers, ['document_state_changed']);
            assert.strictEqual(url.origin + url.pathname, 'https://api.appmixer.example/flows/1/components/2');
            assert.strictEqual(url.searchParams.get('token'), context.getState().token);
            assert.strictEqual(context.getState().webhookId, 'sub-1');
            assert.strictEqual(context.getState().sharedKey, 'shared');
        });

        const delivery = (query, extra = {}) => ({
            webhook: {
                content: {
                    query,
                    headers: { 'x-pandadoc-webhook-event-id': 'evt-1' },
                    data: [
                        { event: 'document_state_changed', data: { id: 'doc1', status: 'document.completed' } },
                        { event: 'document_state_changed', data: { id: 'doc2', status: 'document.sent' } },
                        { event: 'recipient_completed', data: { id: 'doc1' } }
                    ],
                    ...extra
                }
            }
        });

        it('rejects a call without the right token', async function() {

            const context = createContext({ state: { token: 'secret' }, messages: delivery({ token: 'wrong' }) });

            await load('DocumentStateChanged').receive(context);

            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.response.firstCall.args[1], 403);
        });

        it('checks the HMAC signature of the raw body when the engine provides it', async function() {

            const raw = '[{"event":"document_state_changed","data":{"id":"doc1"}}]';
            const good = crypto.createHmac('sha256', 'shared').update(raw).digest('hex');
            const state = { token: 'secret', sharedKey: 'shared' };

            assert.strictEqual(lib.verifyWebhook(state, { query: { token: 'secret', signature: good }, rawBody: raw }), true);
            assert.strictEqual(lib.verifyWebhook(state, { query: { token: 'secret', signature: 'bad' }, rawBody: raw }), false);
        });

        it('emits only its event type, filtered by status, once per delivery', async function() {

            const context = createContext({
                state: { token: 'secret' },
                properties: { status: 'document.completed' },
                messages: delivery({ token: 'secret' })
            });

            await load('DocumentStateChanged').receive(context);
            await load('DocumentStateChanged').receive(context);

            assert.deepStrictEqual(context.sent, [{
                data: { event: 'document_state_changed', id: 'doc1', status: 'document.completed' },
                port: 'out'
            }]);
        });

        it('test() reshapes the latest document details into the event', async function() {

            const context = createContext();
            context.httpRequest.onFirstCall().resolves({ data: { results: [{ id: 'doc1' }] } });
            context.httpRequest.onSecondCall().resolves({ data: { id: 'doc1', name: 'Quote', status: 'document.completed' } });

            await load('RecipientCompleted').test(context);

            assert.strictEqual(context.httpRequest.firstCall.args[0].params.status, 2);
            assert.deepStrictEqual(context.sent[0].data, {
                event: 'recipient_completed', id: 'doc1', name: 'Quote', status: 'document.completed'
            });
        });
    });

    describe('New Document', function() {

        const { diff } = load('NewDocument');
        const page = (ids, prefix = '2026-11-') => ids.map((id, i) => ({ id, date_created: prefix + String(30 - i).padStart(2, '0') }));

        it('records the existing documents on the first tick without emitting', function() {

            const result = diff(undefined, page(['a', 'b']));
            assert.deepStrictEqual(result.newItems, []);
            assert.deepStrictEqual(result.state.known, ['a', 'b']);
        });

        it('emits a document that was not there before', function() {

            const result = diff({ known: ['a', 'b'], floor: null }, page(['c', 'a', 'b']));
            assert.deepStrictEqual(result.newItems.map(d => d.id), ['c']);
        });

        it('keeps the state on an empty answer', function() {

            const result = diff({ known: ['a'], floor: null }, []);
            assert.deepStrictEqual(result, { newItems: [], state: null });
        });

        it('does not fire for an older document that slides onto a full page', function() {

            const full = Array.from({ length: 100 }, (_, i) => ({
                id: 'd' + i,
                date_created: new Date(Date.UTC(2026, 10, 20) - i * 60000).toISOString()
            }));
            const first = diff({ known: [] }, full);
            assert.ok(first.state.floor);

            // d0 deleted, an older document appears at the end of the page
            const next = full.slice(1).concat([{ id: 'old', date_created: '2020-01-01T00:00:00.000Z' }]);
            const result = diff(first.state, next);
            assert.deepStrictEqual(result.newItems, []);
        });
    });
});
