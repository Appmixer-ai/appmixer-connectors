'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const findGoogleResults = require('../../core/FindGoogleResults/FindGoogleResults');
const findGoogleNews = require('../../core/FindGoogleNews/FindGoogleNews');
const getUsage = require('../../core/GetUsage/GetUsage');
const makeApiCall = require('../../core/MakeApiCall/MakeApiCall');

class CancelError extends Error {}

function contextFor(content, httpRequest, properties = {}) {

    const output = { sent: [] };
    return {
        output,
        auth: { apiKey: 'test-api-key-material' },
        messages: { in: { content } },
        properties,
        httpRequest,
        CancelError,
        sendJson: (data, port) => {
            output.sent.push({ data, port });
            output.data = data;
            output.port = port;
            return { data, port };
        }
    };
}

describe('Autom connector', () => {

    it('validates the key with GET /v1/usage', async () => {
        const calls = [];
        const ok = await auth.definition.validate({ apiKey: 'test-api-key-material', httpRequest: async options => { calls.push(options); return { data: {} }; } });
        assert.equal(ok, true);
        assert.equal(calls[0].url, 'https://api.autom.dev/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
    });

    it('reports a 401 as an invalid key', async () => {
        const httpRequest = async () => { const err = new Error('401'); err.response = { status: 401 }; throw err; };
        await assert.rejects(() => auth.definition.validate({ apiKey: 'bad', httpRequest }), /Invalid Autom API key/);
    });

    it('masks the key in the profile', async () => {
        const profile = await auth.definition.requestProfileInfo({ apiKey: 'abcdefgh12345678wxyz' });
        assert.equal(profile.key, 'abcdefgh...wxyz');
    });

    it('puts the API error message on the thrown error', async () => {
        const ctx = contextFor({ query: 'x', country: 'us', language: 'x' }, async () => {
            const err = new Error('Request failed');
            err.response = { status: 400, data: { error: 'Invalid query' } };
            throw err;
        });
        await assert.rejects(() => findGoogleResults.receive(ctx), /Autom: Invalid query/);
    });

    it('Search Google calls GET /v1/google/search with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ query: 'test query', country: 'us', language: 'value', outputType: 'array' }, async options => {
            calls.push(options);
            return { data: { organic_results: [{ position: 1, title: 'Example Domain', link: 'https://example.com/', domain: 'example.com', snippet: 's' }, { position: 2, title: 'No link', link: '' }] } };
        });
        await findGoogleResults.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.autom.dev/v1/google/search');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'test query', gl: 'us', hl: 'value' });
        assert.equal(ctx.output.port, 'out');
        assert.ok(Array.isArray(ctx.output.data.result));
        assert.ok(ctx.output.data.result.length >= 1);
    });
    it('Search Google cancels without Query', async () => {
        const ctx = contextFor({ query: '', country: 'us', language: 'value', outputType: 'array' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => findGoogleResults.receive(ctx), CancelError);
    });
    it('Search Google sends notFound when there is no result', async () => {
        const ctx = contextFor({ query: 'test query', country: 'us', language: 'value', outputType: 'array' }, async () => ({ data: {} }));
        await findGoogleResults.receive(ctx);
        assert.equal(ctx.output.port, 'notFound');
    });
    it('Search Google News calls GET /v1/google/news with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ query: 'test query', country: 'us', language: 'value', outputType: 'array' }, async options => {
            calls.push(options);
            return { data: { organic_results: [{ position: 1, title: 'Markets rally', link: 'https://news.example.com/a', source: 'Example News', date: '2 hours ago' }] } };
        });
        await findGoogleNews.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.autom.dev/v1/google/news');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'test query', gl: 'us', hl: 'value' });
        assert.equal(ctx.output.port, 'out');
        assert.ok(Array.isArray(ctx.output.data.result));
        assert.ok(ctx.output.data.result.length >= 1);
    });
    it('Search Google News cancels without Query', async () => {
        const ctx = contextFor({ query: '', country: 'us', language: 'value', outputType: 'array' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => findGoogleNews.receive(ctx), CancelError);
    });
    it('Search Google News sends notFound when there is no result', async () => {
        const ctx = contextFor({ query: 'test query', country: 'us', language: 'value', outputType: 'array' }, async () => ({ data: {} }));
        await findGoogleNews.receive(ctx);
        assert.equal(ctx.output.port, 'notFound');
    });
    it('Get Usage calls GET /v1/usage with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({}, async options => {
            calls.push(options);
            return { data: { remaining: 48500, total_used: 1500, renewal_date: '2026-12-01' } };
        });
        await getUsage.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.autom.dev/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, {});
        assert.deepEqual(ctx.output.data, { remaining: 48500, total_used: 1500, renewal_date: '2026-12-01' });
    });

    it('Make API Call sends the key only to the Autom API', async () => {
        const calls = [];
        const ctx = contextFor({ url: '/v1/usage', method: 'GET', headers: '{"x-api-key":"evil","X-Test":"1"}' }, async options => {
            calls.push(options);
            return { status: 200, headers: {}, data: { ok: true } };
        });
        await makeApiCall.receive(ctx);
        assert.equal(calls[0].url, 'https://api.autom.dev/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.equal(calls[0].headers['X-Test'], '1');
        assert.deepEqual(ctx.output.data, { statusCode: 200, headers: {}, body: { ok: true } });

        const other = contextFor({ url: 'https://evil.example.com/steal', method: 'GET' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => makeApiCall.receive(other), CancelError);
    });

    it('resolves relative paths on the API host', () => {
        const ctx = contextFor({}, null);
        assert.equal(lib.resolveApiUrl(ctx, 'v1/usage'), 'https://api.autom.dev/v1/usage');
        assert.throws(() => lib.resolveApiUrl(ctx, 'https://user:pass@api.autom.dev/x'), CancelError);
    });
});
