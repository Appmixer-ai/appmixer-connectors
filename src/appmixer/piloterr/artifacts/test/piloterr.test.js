'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const getWebsiteHtml = require('../../core/GetWebsiteHtml/GetWebsiteHtml');
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

describe('Piloterr connector', () => {

    it('validates the key with GET /v2/usage', async () => {
        const calls = [];
        const ok = await auth.definition.validate({ apiKey: 'test-api-key-material', httpRequest: async options => { calls.push(options); return { data: {} }; } });
        assert.equal(ok, true);
        assert.equal(calls[0].url, 'https://api.piloterr.com/v2/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
    });

    it('reports a 401 as an invalid key', async () => {
        const httpRequest = async () => { const err = new Error('401'); err.response = { status: 401 }; throw err; };
        await assert.rejects(() => auth.definition.validate({ apiKey: 'bad', httpRequest }), /Invalid Piloterr API key/);
    });

    it('masks the key in the profile', async () => {
        const profile = await auth.definition.requestProfileInfo({ apiKey: 'abcdefgh12345678wxyz' });
        assert.equal(profile.key, 'abcdefgh...wxyz');
    });

    it('puts the API error message on the thrown error', async () => {
        const ctx = contextFor({ url: 'x', engine: 'crawler' }, async () => {
            const err = new Error('Request failed');
            err.response = { status: 400, data: { error: 'Invalid query' } };
            throw err;
        });
        await assert.rejects(() => getWebsiteHtml.receive(ctx), /Piloterr: Invalid query/);
    });

    it('Get Website HTML calls GET /v2/website/{engine} with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ url: 'https://example.com', engine: 'crawler' }, async options => {
            calls.push(options);
            return { data: '<!doctype html><html><head><title>Example Domain</title></head><body><p>Hi</p></body></html>' };
        });
        await getWebsiteHtml.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.piloterr.com/v2/website/crawler');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'https://example.com' });
        assert.equal(ctx.output.port, 'out');
        assert.match(ctx.output.data.html, /<html/i);
    });
    it('Get Website HTML cancels without URL', async () => {
        const ctx = contextFor({ url: '', engine: 'crawler' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => getWebsiteHtml.receive(ctx), CancelError);
    });
    it('Get Usage calls GET /v2/usage with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({}, async options => {
            calls.push(options);
            return { data: { remaining: 48500, total_used: 1500, renewal_date: '2026-12-01' } };
        });
        await getUsage.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.piloterr.com/v2/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, {});
        assert.deepEqual(ctx.output.data, { remaining: 48500, total_used: 1500, renewal_date: '2026-12-01' });
    });

    it('Make API Call sends the key only to the Piloterr API', async () => {
        const calls = [];
        const ctx = contextFor({ url: '/v2/usage', method: 'GET', headers: '{"x-api-key":"evil","X-Test":"1"}' }, async options => {
            calls.push(options);
            return { status: 200, headers: {}, data: { ok: true } };
        });
        await makeApiCall.receive(ctx);
        assert.equal(calls[0].url, 'https://api.piloterr.com/v2/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.equal(calls[0].headers['X-Test'], '1');
        assert.deepEqual(ctx.output.data, { statusCode: 200, headers: {}, body: { ok: true } });

        const other = contextFor({ url: 'https://evil.example.com/steal', method: 'GET' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => makeApiCall.receive(other), CancelError);
    });

    it('resolves relative paths on the API host', () => {
        const ctx = contextFor({}, null);
        assert.equal(lib.resolveApiUrl(ctx, 'v2/usage'), 'https://api.piloterr.com/v2/usage');
        assert.throws(() => lib.resolveApiUrl(ctx, 'https://user:pass@api.piloterr.com/x'), CancelError);
    });
});
