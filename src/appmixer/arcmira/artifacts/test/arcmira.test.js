'use strict';

const assert = require('assert');
const path = require('path');
const { createMockContext } = require('../../../../../test/utils');

const ROOT = path.join(__dirname, '../..');
const lib = require(path.join(ROOT, 'lib'));
const FindTranscripts = require(path.join(ROOT, 'core/FindTranscripts/FindTranscripts'));
const ResolveEntity = require(path.join(ROOT, 'core/ResolveEntity/ResolveEntity'));
const MakeApiCall = require(path.join(ROOT, 'core/MakeApiCall/MakeApiCall'));
const auth = require(path.join(ROOT, 'auth'));

const CHUNK = {
    id: 'chk_1',
    video_id: 'dQw4w9WgXcQ',
    channel_id: 'UCcefcZRL2oaA_uBNeo5UOWg',
    channel_name: 'Y Combinator',
    channel_page: null,
    video_title: 'AI Agents',
    speakers: [],
    source: 'creator_captions',
    source_label: 'Creator captions',
    published_at: '2026-09-14T16:00:00Z',
    text: 'We use OpenAI models...',
    start_seconds: 4787,
    watch_url: 'https://arcmira.com/watch?v=dQw4w9WgXcQ&t=4787',
    cite_line: 'AI Agents, 1:19:47, Y Combinator, 2026-09-14',
    score: 12.8,
    speakers_by: [{ id: 'ent_1', name: 'Garry Tan', type: 'person' }]
};

function makeContext(content) {
    const context = createMockContext();
    context.auth = { apiKey: 'arc_sk_test' };
    context.properties = {};
    context.messages = { in: { content } };
    return context;
}

describe('arcmira', () => {

    describe('lib.resolveApiUrl', () => {
        const context = makeContext({});
        it('accepts relative paths with or without the /v1 prefix', () => {
            assert.strictEqual(lib.resolveApiUrl(context, '/me'), 'https://api.arcmira.com/v1/me');
            assert.strictEqual(lib.resolveApiUrl(context, 'search'), 'https://api.arcmira.com/v1/search');
            assert.strictEqual(lib.resolveApiUrl(context, '/v1/monitors'), 'https://api.arcmira.com/v1/monitors');
            assert.strictEqual(lib.resolveApiUrl(context, 'https://api.arcmira.com/v1/me'), 'https://api.arcmira.com/v1/me');
        });
        it('refuses other hosts and path escapes', () => {
            assert.throws(() => lib.resolveApiUrl(context, 'https://evil.example.com/v1/me'), /must target/);
            assert.throws(() => lib.resolveApiUrl(context, '/../health'), /must target/);
        });
    });

    describe('lib.apiRequest', () => {
        it('turns an Arcmira 400 into a CancelError with code and request id', async () => {
            const context = makeContext({});
            const err = new Error('Request failed');
            err.response = { status: 400, data: { error: { code: 'id_required', message: 'about takes ids.', request_id: 'req_1' } } };
            context.httpRequest.rejects(err);
            await assert.rejects(lib.apiRequest(context, { method: 'GET', url: 'x' }), e => {
                assert.strictEqual(e.name, 'CancelError');
                assert(e.message.includes('id_required'));
                assert(e.message.includes('req_1'));
                return true;
            });
        });
        it('keeps 429 retryable', async () => {
            const context = makeContext({});
            const err = new Error('Too many');
            err.response = { status: 429, data: { error: { code: 'rate_limited', message: 'Slow down.' } } };
            context.httpRequest.rejects(err);
            await assert.rejects(lib.apiRequest(context, { method: 'GET', url: 'x' }), e => e.name !== 'CancelError');
        });
    });

    describe('FindTranscripts', () => {
        it('maps inputs to query parameters and emits the first passage', async () => {
            const context = makeContext({
                query: 'OpenAI',
                about: 'ent_1, ent_2',
                kind: ['sponsored', 'organic'],
                channelIds: '',
                maxResults: 3,
                outputType: 'first'
            });
            context.httpRequest.resolves({ status: 200, data: { returned: 1, chunks: [CHUNK] } });
            await FindTranscripts.receive(context);
            const req = context.httpRequest.firstCall.args[0];
            assert.strictEqual(req.url, 'https://api.arcmira.com/v1/search');
            assert.strictEqual(req.headers.Authorization, 'Bearer arc_sk_test');
            assert.deepStrictEqual(req.params, { q: 'OpenAI', about: 'ent_1,ent_2', kind: 'sponsored,organic', limit: 3 });
            const [out, port] = context.sendJson.firstCall.args;
            assert.strictEqual(port, 'out');
            assert.strictEqual(out.videoId, 'dQw4w9WgXcQ');
            assert.strictEqual(out.watchUrl, CHUNK.watch_url);
            assert.deepStrictEqual(out.about, []);
            assert.strictEqual(out.count, 1);
        });
        it('sends notFound when there are no passages', async () => {
            const context = makeContext({ query: 'zzqx', outputType: 'array' });
            context.httpRequest.resolves({ status: 200, data: { returned: 0, chunks: [] } });
            await FindTranscripts.receive(context);
            assert.strictEqual(context.sendJson.firstCall.args[1], 'notFound');
        });
        it('requires a query', async () => {
            await assert.rejects(FindTranscripts.receive(makeContext({})), /Query is required/);
        });
        it('every ITEM_SCHEMA leaf has an example', () => {
            Object.values(FindTranscripts.ITEM_SCHEMA.properties).forEach(p => assert(p.example !== undefined));
        });
    });

    describe('ResolveEntity', () => {
        it('returns the best match', async () => {
            const context = makeContext({ query: 'OpenAI', type: 'organization', maxCandidates: 3 });
            context.httpRequest.resolves({ status: 200, data: {
                query: 'OpenAI', context: null, confidence: 'exact',
                best: { id: 'ent_9', name: 'OpenAI', type: 'organization', slug: 'openai', appearance_count: 10,
                    youtube_channel_id: null, description: null, page: null, match: 'exact' },
                suggested: null, ask: null, candidates: [], note: 'Use ent_9.'
            } });
            await ResolveEntity.receive(context);
            assert.deepStrictEqual(context.httpRequest.firstCall.args[0].params, { q: 'OpenAI', type: 'organization', limit: 3 });
            const [out, port] = context.sendJson.firstCall.args;
            assert.strictEqual(port, 'out');
            assert.strictEqual(out.entityId, 'ent_9');
            assert.strictEqual(out.assumed, false);
            assert.strictEqual(out.best.appearanceCount, 10);
        });
        it('uses the suggested entity and flags it as assumed', async () => {
            const context = makeContext({ query: 'Sam' });
            context.httpRequest.resolves({ status: 200, data: {
                query: 'Sam', confidence: 'ambiguous', best: null,
                suggested: { id: 'ent_124463', name: 'Sam Altman', type: 'person', reason: 'dominant', evidence: '11x' },
                ask: null, candidates: [{ id: 'ent_1' }], note: 'n'
            } });
            await ResolveEntity.receive(context);
            const [out] = context.sendJson.firstCall.args;
            assert.strictEqual(out.entityId, 'ent_124463');
            assert.strictEqual(out.assumed, true);
            assert.strictEqual(out.suggested.reason, 'dominant');
        });
        it('sends notFound on no match', async () => {
            const context = makeContext({ query: 'zzqx' });
            context.httpRequest.resolves({ status: 200, data: {
                query: 'zzqx', confidence: 'none', best: null, suggested: null, ask: null, candidates: [], note: 'n'
            } });
            await ResolveEntity.receive(context);
            assert.strictEqual(context.sendJson.firstCall.args[1], 'notFound');
        });
    });

    describe('MakeApiCall', () => {
        it('never lets a header replace the account key', async () => {
            const context = makeContext({
                url: '/me',
                method: 'GET',
                headers: JSON.stringify({ Authorization: 'Bearer other', 'X-Request-Id': 'abc' })
            });
            context.httpRequest.resolves({ status: 200, headers: {}, data: { tier: 'free' } });
            await MakeApiCall.receive(context);
            const req = context.httpRequest.firstCall.args[0];
            assert.strictEqual(req.headers.Authorization, 'Bearer arc_sk_test');
            assert.strictEqual(req.headers['X-Request-Id'], 'abc');
            assert.deepStrictEqual(context.sendJson.firstCall.args, [{ status: 200, headers: {}, body: { tier: 'free' } }, 'out']);
        });
        it('rejects invalid JSON bodies', async () => {
            const context = makeContext({ url: '/monitors', method: 'POST', body: '{nope' });
            await assert.rejects(MakeApiCall.receive(context), /valid JSON/);
        });
    });

    describe('auth', () => {
        it('names the account from GET /v1/me', async () => {
            const context = createMockContext();
            context.apiKey = 'arc_sk_test';
            context.httpRequest.resolves({ data: {
                user_id: 'u1', key_label: 'Zapier', email_masked: 'z***@example.com',
                account: { id: 'a1', name: 'Acme', kind: 'team', plan: 'pro' }, tier: 'pro'
            } });
            const profile = await auth.definition.requestProfileInfo(context);
            assert.strictEqual(context.httpRequest.firstCall.args[0].headers.Authorization, 'Bearer arc_sk_test');
            assert.strictEqual(profile.accountName, 'Acme (z***@example.com)');
        });
    });
});
