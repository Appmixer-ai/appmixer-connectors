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
    it('Get Website HTML saves the page as a file when asked', async () => {
        const html = '<!doctype html><html><body><p>Hi</p></body></html>';
        const ctx = contextFor({ url: 'https://example.com', engine: 'rendering', saveAsFile: true }, async () => ({ data: html }));
        const saved = [];
        ctx.saveFileStream = async (filename, buffer) => {
            saved.push({ filename, buffer });
            return { fileId: 'file-123' };
        };
        await getWebsiteHtml.receive(ctx);
        assert.equal(saved.length, 1);
        assert.match(saved[0].filename, /^piloterr-rendering-\d+\.html$/);
        assert.equal(saved[0].buffer.toString('utf8'), html);
        assert.equal(ctx.output.data.fileId, 'file-123');
        assert.equal(ctx.output.data.fileSize, Buffer.byteLength(html));
        assert.equal(ctx.output.data.html, undefined);
    });
    it('Get Website HTML rejects a response that is not the page HTML', async () => {
        const ctx = contextFor({ url: 'https://example.com', engine: 'crawler' }, async () => ({ data: { status: 'pending' } }));
        await assert.rejects(() => getWebsiteHtml.receive(ctx), /expected the page HTML/);
        assert.equal(ctx.output.sent.length, 0);
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

    it('refuses protocol-relative and look-alike hosts', () => {
        const ctx = contextFor({}, null);
        assert.throws(() => lib.resolveApiUrl(ctx, '//evil.example.com/x'), CancelError);
        assert.throws(() => lib.resolveApiUrl(ctx, 'https://api.piloterr.com.evil.example.com/x'), CancelError);
        assert.throws(() => lib.resolveApiUrl(ctx, 'http://api.piloterr.com/v2/usage'), CancelError);
        assert.equal(lib.resolveApiUrl(ctx, 'https://api.piloterr.com/v2/usage'), 'https://api.piloterr.com/v2/usage');
    });

    it('Get Website HTML cancels on an unknown engine without a request', async () => {
        const ctx = contextFor({ url: 'https://example.com', engine: 'turbo' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => getWebsiteHtml.receive(ctx), /Engine must be one of/);
    });

    it('Make API Call sends the Designer key-value rows as query parameters and headers', async () => {
        const calls = [];
        // The Designer stores key-value fields as the JSON string of an object.
        const ctx = contextFor({
            url: '/v2/website/crawler',
            method: 'GET',
            parameters: '{"query":"https://example.com"}',
            headers: '{"Accept":"text/html","authorization":"Bearer other"}'
        }, async options => {
            calls.push(options);
            return { status: 200, headers: { 'content-type': 'application/json' }, data: '<html></html>' };
        });
        await makeApiCall.receive(ctx);
        assert.deepEqual(calls[0].params, { query: 'https://example.com' });
        assert.equal(calls[0].headers.Accept, 'text/html');
        assert.equal(calls[0].headers.authorization, undefined);
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.equal(calls[0].data, undefined);
        assert.equal(ctx.output.data.statusCode, 200);
        assert.equal(ctx.output.data.body, '<html></html>');
    });

    it('Make API Call sends a JSON body and cancels on an invalid one', async () => {
        const calls = [];
        const ctx = contextFor({ url: '/v2/example', method: 'POST', body: '{"query":"coffee"}' }, async options => {
            calls.push(options);
            return { status: 201, headers: {}, data: { id: 1 } };
        });
        await makeApiCall.receive(ctx);
        assert.equal(calls[0].method, 'POST');
        assert.deepEqual(calls[0].data, { query: 'coffee' });
        assert.equal(calls[0].headers['Content-Type'], 'application/json');
        assert.equal(calls[0].params, undefined);

        const bad = contextFor({ url: '/v2/example', method: 'POST', body: '{not json' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => makeApiCall.receive(bad), /Request Body must be valid JSON/);

        const badHeaders = contextFor({ url: '/v2/usage', method: 'GET', headers: 'not json' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => makeApiCall.receive(badHeaders), CancelError);
    });
});
